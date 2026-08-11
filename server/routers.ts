import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { runTrustEngine } from "./verification";
import * as db from "./db";
import { nanoid } from "nanoid";
import { parseExifFromUrl } from "./_core/exifParser";
import { storageCreatePresignedUploadUrl } from "./storage";
import { hasS3Config } from "./_core/env";

const UPLOAD_FOLDER = {
  "image/": "uploads/images",
  "video/": "uploads/videos",
} as const;

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(`${COOKIE_NAME}_refresh`, {
        ...cookieOptions,
        maxAge: -1,
      });
      return {
        success: true,
      } as const;
    }),
  }),

  verification: router({
    /**
     * Start a verification analysis
     * Runs all four modules in parallel and stores the result
     */
    analyze: protectedProcedure
      .input(
        z.object({
          mediaUrl: z.string().url(),
          mediaType: z.enum(["image", "video"]),
          claimEvent: z.string().optional(),
          claimLocation: z.string().optional(),
          claimDate: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Run the trust engine
          const result = await runTrustEngine({
            mediaUrl: input.mediaUrl,
            mediaType: input.mediaType,
            claimEvent: input.claimEvent,
            claimLocation: input.claimLocation,
            claimDate: input.claimDate,
          });

          // Store the report in database
          const shareToken = nanoid(32);
          const report = await db.createVerificationReport({
            userId: ctx.user.id,
            mediaUrl: input.mediaUrl,
            mediaType: input.mediaType,
            claimEvent: input.claimEvent,
            claimLocation: input.claimLocation,
            claimDate: input.claimDate,
            metadataScore: String(result.metadata.score) as any,
            visionScore: String(result.vision.score) as any,
            weatherScore: String(result.weather.score) as any,
            evidenceScore: String(result.evidence.score) as any,
            totalScore: String(result.totalScore) as any,
            statusBand: result.statusBand,
            metadataFindings: {
              ...result.metadata.details,
              findings: result.metadata.findings,
            },
            visionFindings: {
              ...result.vision.details,
              findings: result.vision.findings,
            },
            weatherFindings: {
              ...result.weather.details,
              findings: result.weather.findings,
              isNotRequired: result.weather.isNotRequired,
            },
            evidenceFindings: {
              ...result.evidence.details,
              findings: result.evidence.findings,
            },
            summary: result.summary,
            shareToken,
            isPublic: "false",
          });

          return report;
        } catch (error) {
          console.error("Verification error:", error);
          throw new Error(
            "Verification failed: " +
              (error instanceof Error ? error.message : "Unknown error")
          );
        }
      }),

    /**
     * Get a single verification report by ID
     */
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const report = await db.getVerificationReportById(input.id);
        if (!report) return null;
        // Check ownership
        if (report.userId !== ctx.user.id) return null;
        return report;
      }),

    /**
     * Get user's verification history
     */
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        return await db.getUserVerificationReports(ctx.user.id, input.limit);
      }),

    /**
     * Get a public report by share token
     */
    getPublic: publicProcedure
      .input(z.object({ shareToken: z.string() }))
      .query(async ({ input }) => {
        const report = await db.getVerificationReportByShareToken(
          input.shareToken
        );
        if (!report || report.isPublic === "false") return null;
        return report;
      }),

    /**
     * Make a report public and shareable
     */
    makePublic: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const report = await db.getVerificationReportById(input.id);
        if (!report || report.userId !== ctx.user.id) {
          throw new Error("Report not found or unauthorized");
        }
        return await db.updateVerificationReport(input.id, {
          isPublic: "true",
        });
      }),

    /**
     * Make a report private
     */
    makePrivate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const report = await db.getVerificationReportById(input.id);
        if (!report || report.userId !== ctx.user.id) {
          throw new Error("Report not found or unauthorized");
        }
        return await db.updateVerificationReport(input.id, {
          isPublic: "false",
        });
      }),

    parseExif: protectedProcedure
      .input(z.object({ mediaUrl: z.string().url() }))
      .query(async ({ input }) => {
        return await parseExifFromUrl(input.mediaUrl);
      }),
  }),

  upload: router({
    /**
     * Get a presigned PUT URL so the browser can upload media directly to
     * object storage (S3-compatible or Supabase Storage).
     */
    presignUrl: protectedProcedure
      .input(
        z.object({
          fileName: z.string().min(1).max(255),
          contentType: z.string().min(1).max(200),
          expiresInSeconds: z.number().int().min(60).max(86400).default(3600),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!input.contentType.startsWith("image/") && !input.contentType.startsWith("video/")) {
          throw new Error("Only image and video uploads are supported");
        }
        const prefix = input.contentType.startsWith("video/")
          ? UPLOAD_FOLDER["video/"]
          : UPLOAD_FOLDER["image/"];
        const relKey = `users/${ctx.user.openId}/${prefix}/${Date.now()}-${sanitizeFileName(input.fileName)}`;

        try {
          const result = await storageCreatePresignedUploadUrl(
            relKey,
            input.contentType,
            input.expiresInSeconds
          );
          return {
            ...result,
            uploadExpiresIn: input.expiresInSeconds,
            provider: hasS3Config() ? ("s3" as const) : ("supabase" as const),
          };
        } catch (error) {
          console.error("Presigned upload error:", error);
          throw new Error(
            "Failed to create upload URL: " +
              (error instanceof Error ? error.message : "Unknown error")
          );
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
