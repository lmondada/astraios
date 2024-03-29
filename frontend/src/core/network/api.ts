/* Copyright 2024 Marimo. All rights reserved. */
import { once } from "@/utils/once";
import { Logger } from "../../utils/Logger";
import { getMarimoServerToken } from "../dom/marimo-tag";
import { getSessionId } from "../kernel/session";
import { CompilationHandlers } from "./types";

const getServerTokenOnce = once(() => {
  return getMarimoServerToken();
});

/**
 * Wrapper around fetch that adds XSRF token and session ID to the request and
 * strong types.
 */
export const API = {
  post<REQ, RESP = null>(
    url: string,
    body: REQ,
    opts: {
      headers?: Record<string, string>;
      baseUrl?: string;
    } = {},
  ): Promise<RESP> {
    const baseUrl = opts.baseUrl ?? document.baseURI;
    const fullUrl = `${baseUrl}api${url}`;
    return fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...API.headers(),
        ...opts.headers,
      },
      body: JSON.stringify(body),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        } else if (
          response.headers.get("Content-Type")?.startsWith("application/json")
        ) {
          return response.json() as RESP;
        } else {
          return null as RESP;
        }
      })
      .catch((error) => {
        // Catch and rethrow
        Logger.error(`Error requesting ${fullUrl}`, error);
        throw error;
      });
  },
  sse<RES>(
    url: string,
    opts: {
      handlers: CompilationHandlers<RES>;
      baseUrl: string | null;
    },
  ) {
    let {
      baseUrl,
      handlers: { handleMessage, handleResult },
    } = opts;
    baseUrl = baseUrl ?? document.baseURI;
    const fullUrl = `${baseUrl}api${url}`;
    let sseSource = new EventSource(fullUrl);

    /*
     * Listen for result events similar to the following:
     *
     * event: result
     * data: JSON of type RES
     */
    sseSource.addEventListener("result", (e) => {
      handleResult(JSON.parse(e.data) as RES);
      sseSource.close();
    });
    /**
     * Any other events will be passed to the following
     */
    sseSource.addEventListener("message", (e) => {
      handleMessage(e.data);
    });
  },
  headers() {
    return {
      "Marimo-Session-Id": getSessionId(),
      "Marimo-Server-Token": getServerTokenOnce(),
    };
  },
};
