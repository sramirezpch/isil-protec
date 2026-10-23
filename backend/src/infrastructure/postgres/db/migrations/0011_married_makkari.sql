CREATE TYPE "public"."purchaseStatus" AS ENUM('PENDING', 'RECEIVED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "purchase" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplierId" uuid NOT NULL,
	"arrivalDate" timestamp with time zone,
	"status" "purchaseStatus" DEFAULT 'PENDING' NOT NULL,
	"currency" varchar(10) NOT NULL,
	"exchangeRate" numeric(12, 4) NOT NULL,
	"internationalFreight" numeric(12, 2) DEFAULT '0' NOT NULL,
	"customsDuties" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "purchaseItem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchaseId" uuid NOT NULL,
	"productId" uuid NOT NULL,
	"quantityOrdered" integer NOT NULL,
	"quantityReceived" integer,
	"unitCostForeign" numeric(12, 2) NOT NULL,
	"unitCostPen" numeric(12, 2) NOT NULL,
	"unitLandedCost" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_supplierId_supplier_id_fk" FOREIGN KEY ("supplierId") REFERENCES "public"."supplier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchaseItem" ADD CONSTRAINT "purchaseItem_purchaseId_purchase_id_fk" FOREIGN KEY ("purchaseId") REFERENCES "public"."purchase"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchaseItem" ADD CONSTRAINT "purchaseItem_productId_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;