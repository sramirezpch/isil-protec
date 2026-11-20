CREATE TYPE "public"."reservationStatus" AS ENUM('VIGENTE');--> statement-breakpoint
CREATE TYPE "public"."reservationDiscountType" AS ENUM('PORCENTAJE', 'MONTO');--> statement-breakpoint
CREATE TABLE "reservation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clientId" uuid NOT NULL,
	"due_date" date NOT NULL,
	"status" "reservationStatus" DEFAULT 'VIGENTE' NOT NULL,
	"totalAmount" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reservationItem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservationId" uuid NOT NULL,
	"productId" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"cantidadBloqueada" integer NOT NULL,
	"unitPrice" numeric(12, 2) NOT NULL,
	"discountType" "reservationDiscountType",
	"discountValue" numeric(12, 2),
	"lineTotal" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "reservationItem_quantity_positive" CHECK ("reservationItem"."quantity" > 0),
	CONSTRAINT "reservationItem_blocked_quantity_valid" CHECK ("reservationItem"."cantidadBloqueada" >= 0 AND "reservationItem"."cantidadBloqueada" <= "reservationItem"."quantity")
);
--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_clientId_client_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."client"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservationItem" ADD CONSTRAINT "reservationItem_reservationId_reservation_id_fk" FOREIGN KEY ("reservationId") REFERENCES "public"."reservation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservationItem" ADD CONSTRAINT "reservationItem_productId_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reservationItem_reservation_product_unique" ON "reservationItem" USING btree ("reservationId","productId");