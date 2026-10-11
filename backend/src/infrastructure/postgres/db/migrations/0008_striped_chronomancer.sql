CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" text NOT NULL,
	"name" varchar NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"stock" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"franchiseId" uuid NOT NULL,
	"lineaId" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "product_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_franchiseId_franchise_id_fk" FOREIGN KEY ("franchiseId") REFERENCES "public"."franchise"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_lineaId_linea_id_fk" FOREIGN KEY ("lineaId") REFERENCES "public"."linea"("id") ON DELETE no action ON UPDATE no action;