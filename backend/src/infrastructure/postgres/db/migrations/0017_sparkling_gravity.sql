ALTER TYPE "public"."reservationStatus" ADD VALUE 'CONVERTIDA';--> statement-breakpoint
ALTER TABLE "sale" ADD COLUMN "reservationId" uuid;--> statement-breakpoint
ALTER TABLE "saleItem" ADD COLUMN "discountType" "reservationDiscountType";--> statement-breakpoint
ALTER TABLE "saleItem" ADD COLUMN "discountValue" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_reservationId_reservation_id_fk" FOREIGN KEY ("reservationId") REFERENCES "public"."reservation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sale_reservation_unique" ON "sale" USING btree ("reservationId");--> statement-breakpoint
ALTER TABLE "saleItem" ADD CONSTRAINT "saleItem_quantity_positive" CHECK ("saleItem"."quantity" > 0);--> statement-breakpoint
ALTER TABLE "saleItem" ADD CONSTRAINT "saleItem_discount_details_consistent" CHECK ((
        ("saleItem"."discountType" IS NULL AND "saleItem"."discountValue" IS NULL)
        OR
        ("saleItem"."discountType" IS NOT NULL AND "saleItem"."discountValue" IS NOT NULL)
      ));--> statement-breakpoint
ALTER TABLE "saleItem" ADD CONSTRAINT "saleItem_discount_value_valid" CHECK ((
        "saleItem"."discountType" IS NULL
        OR (
          "saleItem"."discountType"::text = 'PORCENTAJE'
          AND "saleItem"."discountValue" >= 0
          AND "saleItem"."discountValue" <= 100
        )
        OR (
          "saleItem"."discountType"::text = 'MONTO'
          AND "saleItem"."discountValue" >= 0
        )
      ));