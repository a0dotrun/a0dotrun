// import * as restateClients from "@restatedev/restate-sdk-clients";
// import { a0RestateClientBaseUrl } from "../config";

// type RestateClient = ReturnType<typeof restateClients.connect>;

// let rscInstance: RestateClient | undefined;

// export const getRestateClient = (): RestateClient => {
//   if (!rscInstance) {
//     rscInstance = restateClients.connect({
//       url: a0RestateClientBaseUrl(),
//     });
//   }
//   return rscInstance;
// };

import { Resonate } from "@resonatehq/sdk";

type ResonateClient = ReturnType<typeof Resonate.remote>;

let rscInstance: ResonateClient | undefined;

export const getResonateClient = (): ResonateClient => {
  if (!rscInstance) {
    rscInstance = Resonate.remote({
      group: "client",
    });
  }
  return rscInstance;
};
