CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jwk" (
	"id" text PRIMARY KEY NOT NULL,
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" varchar(255) NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean NOT NULL,
	"type" varchar(255) NOT NULL,
	"image" varchar(511),
	"username" varchar(255) NOT NULL,
	"github_id" varchar(64) NOT NULL,
	"is_staff" boolean DEFAULT false NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username"),
	CONSTRAINT "user_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_config" (
	"server_id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"revision" varchar(128) NOT NULL,
	"envs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"config_hash" varchar(511) NOT NULL,
	"root_dir" varchar(255) DEFAULT './' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_install" (
	"install_id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"server_id" varchar(255) NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "server_install_user_id_server_id_key" UNIQUE("user_id","server_id")
);
--> statement-breakpoint
CREATE TABLE "server" (
	"server_id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"username" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"avatar_url" varchar(511),
	"is_claimed" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"visibility" varchar(64) NOT NULL,
	"github_repo" varchar(255),
	"github_owner" varchar(255),
	"github_repository_id" integer,
	"branch" varchar(255),
	"mode" varchar(64) NOT NULL,
	"transport" varchar(64) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"addedby_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"homepage" varchar(511),
	"readme" jsonb,
	"license" jsonb,
	CONSTRAINT "server_username_name_key" UNIQUE("username","name")
);
--> statement-breakpoint
CREATE TABLE "server_view" (
	"view_id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"server_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "server_view_user_id_server_id_key" UNIQUE("user_id","server_id")
);
--> statement-breakpoint
CREATE TABLE "collection" (
	"collection_id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(511),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collection_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "server_collection" (
	"server_id" varchar(255) NOT NULL,
	"collection_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "server_id_collection_id_pk" PRIMARY KEY("server_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "build" (
	"build_id" varchar(255) PRIMARY KEY NOT NULL,
	"server_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"trigger_type" varchar(64) NOT NULL,
	"image_ref" varchar(511),
	"image_digest" varchar(511),
	"artifact" varchar(511),
	"github_repo" varchar(511),
	"github_owner" varchar(255),
	"github_ref" varchar(255),
	"commit_hash" varchar(511),
	"status" varchar(64) NOT NULL,
	"config_revision" varchar(128) NOT NULL,
	"envs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"config_hash" varchar(511) NOT NULL,
	"root_dir" varchar(255) DEFAULT './' NOT NULL,
	"built_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployment_log" (
	"log_id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"deployment_id" varchar(255) NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"message" text,
	"level" varchar(128) DEFAULT 'info' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployment" (
	"deployment_id" varchar(255) PRIMARY KEY NOT NULL,
	"build_id" varchar(255) NOT NULL,
	"server_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"install_id" varchar(255) NOT NULL,
	"status" varchar(64) NOT NULL,
	"target" varchar(64) NOT NULL,
	"public_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deployment_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "revision" (
	"revision_id" varchar(255) PRIMARY KEY NOT NULL,
	"build_id" varchar(255) NOT NULL,
	"deployment_id" varchar(255) NOT NULL,
	"server_id" varchar(255) NOT NULL,
	"owner_id" varchar(255) NOT NULL,
	"version" varchar(128),
	"is_current" boolean DEFAULT false NOT NULL,
	"status" varchar(64) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "revision_server_id_version_key" UNIQUE("server_id","version")
);
--> statement-breakpoint
CREATE TABLE "github_installation" (
	"github_installation_id" integer PRIMARY KEY NOT NULL,
	"github_app_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"account_login" varchar(255) NOT NULL,
	"account_type" varchar(64) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"setup_action" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "github_installation_app_id_user_id_account_login_key" UNIQUE("github_app_id","user_id","account_login"),
	CONSTRAINT "github_installation_app_id_user_id_account_id" UNIQUE("github_app_id","user_id","account_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_config" ADD CONSTRAINT "server_config_server_id_server_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."server"("server_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_config" ADD CONSTRAINT "server_config_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_install" ADD CONSTRAINT "server_install_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_install" ADD CONSTRAINT "server_install_server_id_server_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."server"("server_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server" ADD CONSTRAINT "server_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server" ADD CONSTRAINT "server_addedby_id_user_user_id_fk" FOREIGN KEY ("addedby_id") REFERENCES "public"."user"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_view" ADD CONSTRAINT "server_view_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_view" ADD CONSTRAINT "server_view_server_id_server_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."server"("server_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_collection" ADD CONSTRAINT "server_collection_server_id_server_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."server"("server_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_collection" ADD CONSTRAINT "server_collection_collection_id_collection_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection"("collection_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "build" ADD CONSTRAINT "build_server_id_server_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."server"("server_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "build" ADD CONSTRAINT "build_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment_log" ADD CONSTRAINT "deployment_log_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment_log" ADD CONSTRAINT "deployment_log_deployment_id_deployment_deployment_id_fk" FOREIGN KEY ("deployment_id") REFERENCES "public"."deployment"("deployment_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment" ADD CONSTRAINT "deployment_build_id_build_build_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."build"("build_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment" ADD CONSTRAINT "deployment_server_id_server_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."server"("server_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment" ADD CONSTRAINT "deployment_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment" ADD CONSTRAINT "deployment_install_id_server_install_install_id_fk" FOREIGN KEY ("install_id") REFERENCES "public"."server_install"("install_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revision" ADD CONSTRAINT "revision_build_id_build_build_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."build"("build_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revision" ADD CONSTRAINT "revision_deployment_id_deployment_deployment_id_fk" FOREIGN KEY ("deployment_id") REFERENCES "public"."deployment"("deployment_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revision" ADD CONSTRAINT "revision_server_id_server_server_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."server"("server_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revision" ADD CONSTRAINT "revision_owner_id_user_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_installation" ADD CONSTRAINT "github_installation_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE no action ON UPDATE no action;