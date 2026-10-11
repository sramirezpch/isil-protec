CREATE TABLE "franchise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"formato_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "franchise" ADD CONSTRAINT "franchise_formato_id_formato_id_fk" FOREIGN KEY ("formato_id") REFERENCES "public"."formato"("id") ON DELETE no action ON UPDATE no action;