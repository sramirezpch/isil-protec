CREATE TYPE "public"."reservationPaymentMethod" AS ENUM('YAPE', 'PLIN', 'EFECTIVO', 'TRANSFERENCIA', 'TARJETA');--> statement-breakpoint
CREATE TABLE "reservationPayment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservationId" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"paymentMethod" "reservationPaymentMethod" NOT NULL,
	"recordedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservationPayment_amount_positive" CHECK ("reservationPayment"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "reservationPayment" ADD CONSTRAINT "reservationPayment_reservationId_reservation_id_fk" FOREIGN KEY ("reservationId") REFERENCES "public"."reservation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reservationPayment_reservation_idx" ON "reservationPayment" USING btree ("reservationId");