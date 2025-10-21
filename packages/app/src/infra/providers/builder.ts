import z from "zod/v4";

export namespace Builder {
  export interface Metadata {
    [key: string]: any;
  }

  export type Context<M extends Metadata = Metadata> = {
    metadata?: M;
  };

  export type Result<M extends Metadata = Metadata> = {
    status: "success" | "placed" | "error";
    taskId: string;
    image?: string;
    metadata?: M;
  };

  export interface Info<
    Parameters extends z.ZodType = z.ZodType,
    M extends Metadata = Metadata
  > {
    id: string; // e.g., "docker", "gcp-cloud-run"
    init: () => Promise<{
      parameters: Parameters;
      build(
        args: z.infer<Parameters>,
        ctx: Context,
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
