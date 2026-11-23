ALTER TYPE "public"."reservationStatus" ADD VALUE 'CANCELADA';--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "cancellationReason" varchar(500);--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "cancelledAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_cancellation_details_consistent" CHECK ((
        ("reservation"."status"::text = 'CANCELADA'
          AND "reservation"."cancellationReason" IS NOT NULL
          AND "reservation"."cancelledAt" IS NOT NULL)
        OR
        ("reservation"."status"::text <> 'CANCELADA'
          AND "reservation"."cancellationReason" IS NULL
          AND "reservation"."cancelledAt" IS NULL)
      ));