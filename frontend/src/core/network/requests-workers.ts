import { API } from "./api";
import { createNetworkRequests } from "./requests-network";
import { EditRequests, RunRequests } from "./types";

export function createWorkersRequests(): EditRequests & RunRequests {
  let requests = createNetworkRequests();
  // TODO: overwrite requests where useful (eventually everywhere?)
  requests.sendRun = async (cellIds, codes, options) => {
    if (!options) {
      console.error("No defined worker in workers runtime mode");
      return null;
    }
    const { jobId }: { jobId: string } = await API.post(
      "/compile/submit",
      {
        cellIds,
        codes,
        workerId: options.workerId,
      },
      { baseUrl: options.baseUrl },
    );
    API.sse(`/compile/status?jobId=${encodeURIComponent(jobId)}`, options);
    return null;
  };
  return requests;
}
