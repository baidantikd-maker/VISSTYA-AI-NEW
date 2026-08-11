import { relations } from "drizzle-orm";
import { users, verificationReports } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  reports: many(verificationReports),
}));

export const verificationReportsRelations = relations(
  verificationReports,
  ({ one }) => ({
    user: one(users, {
      fields: [verificationReports.userId],
      references: [users.id],
    }),
  })
);
