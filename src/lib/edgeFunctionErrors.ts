type EdgeInvokeError = {
  name?: string;
  message?: string;
};

type EdgeFunctionErrorOptions = {
  error: EdgeInvokeError | null | undefined;
  functionName: string;
  projectUrl?: string;
  response?: Response;
};

function getProjectHost(projectUrl?: string) {
  if (!projectUrl) return "your configured backend";

  try {
    return new URL(projectUrl).host;
  } catch {
    return projectUrl;
  }
}

async function readResponseMessage(response?: Response) {
  if (!response) return null;

  try {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await response.clone().json();
      if (typeof json?.error === "string" && json.error) return json.error;
      if (typeof json?.message === "string" && json.message) return json.message;
    }

    const text = (await response.clone().text()).trim();
    return text || null;
  } catch {
    return null;
  }
}

export async function getEdgeFunctionErrorMessage({ error, functionName, projectUrl, response }: EdgeFunctionErrorOptions) {
  const projectHost = getProjectHost(projectUrl);
  const responseMessage = await readResponseMessage(response);

  if (error?.name === "FunctionsFetchError") {
    return `Could not reach ${functionName} on ${projectHost}. In your external Cline repo, either deploy the ${functionName} function to that same backend or change VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY so the app points to the backend where the function already exists.`;
  }

  if (error?.name === "FunctionsRelayError") {
    return `The backend relay could not reach ${functionName} on ${projectHost}. Usually this means the function is missing, paused, or blocked before execution.`;
  }

  if (error?.name === "FunctionsHttpError" && response) {
    return `${functionName} returned HTTP ${response.status}${responseMessage ? `: ${responseMessage}` : ""}`;
  }

  if (responseMessage) return responseMessage;

  return error?.message || `${functionName} request failed`;
}