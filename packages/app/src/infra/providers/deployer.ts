import z from "zod/v4";
import { DeploymentStatusType } from "../../ty";

export namespace Deployer {
  export interface Metadata {
    [key: string]: any;
  }

  export type Context<M extends Metadata = Metadata> = {
    dryRun?: boolean;
    metadata?: M;
  };

  export type Result<M extends Metadata = Metadata> = {
    status: DeploymentStatusType | "dry_run";
    message?: string;
    url?: string;
    resourceIds?: { [key: string]: string };
    metadata?: M;
  };

  export interface Info<
    Parameters extends z.ZodType = z.ZodType,
    M extends Metadata = Metadata
  > {
    id: string;
    init: () => Promise<{
      parameters: Parameters;
      deploy(
        args: z.infer<Parameters>,
        ctx: Context<M>,
        metadata?: M
      ): Promise<Result<M>>;
    }>;
  }

  export function define<Parameters extends z.ZodType, Result extends Metadata>(
    id: string,
    init:
      | Info<Parameters, Result>["init"]
      | Awaited<ReturnType<Info<Parameters, Result>["init"]>>
  ): Info<Parameters, Result> {
    return {
      id,
      init: async () => {
        if (init instanceof Function) return init();
        return init;
      },
    };
  }
}
