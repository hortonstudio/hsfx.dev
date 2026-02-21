"use client";

import { useState, useMemo } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Label } from "./Label";
import { Switch } from "./Switch";
import { Spinner } from "./Spinner";
import { Badge } from "./Badge";
import { CodeEditor } from "./CodeEditor";
import type { ApiParam } from "@/lib/docs/apiData";
import { brand } from "@/config";

interface ApiPlaygroundProps {
  apiName: "css" | "icons" | "button-styles";
  parameters: ApiParam[];
  endpoint: string;
}

export function ApiPlayground({
  apiName,
  parameters,
  endpoint,
}: ApiPlaygroundProps) {
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const param of parameters) {
      if (param.default) {
        defaults[param.name] = param.default;
      } else if (param.required) {
        defaults[param.name] = "";
      }
    }
    return defaults;
  });

  const [response, setResponse] = useState<string | null>(null);
  const [responseInfo, setResponseInfo] = useState<{
    status: number;
    contentType: string;
    time: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const curlCommand = useMemo(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(paramValues)) {
      if (value && value !== "false") {
        params.set(key, value);
      }
    }
    const queryString = params.toString();
    const url = `https://${brand.domain}${endpoint}${queryString ? `?${queryString}` : ""}`;
    return `curl -H "x-api-key: YOUR_API_KEY" \\\n  "${url}"`;
  }, [paramValues, endpoint]);

  const responseLanguage = useMemo(() => {
    if (!responseInfo) return "json";
    if (responseInfo.contentType.includes("text/css")) return "css";
    return "json";
  }, [responseInfo]);

  const handleParamChange = (name: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setResponseInfo(null);

    const startTime = performance.now();

    try {
      // Build params, filtering out empty values and false booleans
      const filteredParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(paramValues)) {
        if (value && value !== "false") {
          filteredParams[key] = value;
        }
      }

      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api: apiName, params: filteredParams }),
      });

      const elapsed = Math.round(performance.now() - startTime);
      const contentType = res.headers.get("content-type") || "text/plain";
      const body = await res.text();

      // Pretty-print JSON responses
      let displayBody = body;
      if (contentType.includes("application/json")) {
        try {
          displayBody = JSON.stringify(JSON.parse(body), null, 2);
        } catch {
          // keep raw text
        }
      }

      setResponse(displayBody);
      setResponseInfo({ status: res.status, contentType, time: elapsed });
    } catch {
      setError("Failed to send request. Are you logged in?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-surface/50 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="default">{apiName.toUpperCase()} API</Badge>
          <span className="text-sm text-text-muted">Interactive Playground</span>
        </div>
        <Button
          size="sm"
          onClick={handleSendRequest}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner size="sm" />
              <span className="ml-2">Sending...</span>
            </>
          ) : (
            "Send Request"
          )}
        </Button>
      </div>

      {/* Parameters */}
      <div className="p-4 space-y-4 border-b border-border">
        <h4 className="text-sm font-medium text-text-secondary">Parameters</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {parameters.map((param) => (
            <div key={param.name} className="space-y-1.5">
              <Label className="text-xs">
                {param.name}
                {param.required && (
                  <span className="text-red-500 ml-0.5">*</span>
                )}
              </Label>
              {param.type === "boolean" ? (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={paramValues[param.name] === "true"}
                    onCheckedChange={(checked) =>
                      handleParamChange(param.name, String(checked))
                    }
                  />
                  <span className="text-xs text-text-muted">
                    {paramValues[param.name] === "true" ? "true" : "false"}
                  </span>
                </div>
              ) : (
                <Input
                  placeholder={param.description}
                  value={paramValues[param.name] || ""}
                  onChange={(e) =>
                    handleParamChange(param.name, e.target.value)
                  }
                  className="text-sm"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* cURL Preview */}
      <div className="border-b border-border">
        <div className="px-4 py-2 bg-surface/30">
          <span className="text-xs font-medium text-text-muted">
            cURL Command
          </span>
        </div>
        <div className="px-4 py-3 bg-[#1e1e1e]">
          <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap break-all">
            {curlCommand}
          </pre>
        </div>
      </div>

      {/* Response */}
      <div>
        <div className="px-4 py-2 bg-surface/30 flex items-center justify-between">
          <span className="text-xs font-medium text-text-muted">Response</span>
          {responseInfo && (
            <div className="flex items-center gap-3 text-xs">
              <Badge
                variant={responseInfo.status < 400 ? "default" : "error"}
              >
                {responseInfo.status}
              </Badge>
              <span className="text-text-dim">
                {responseInfo.contentType.split(";")[0]}
              </span>
              <span className="text-text-dim">{responseInfo.time}ms</span>
            </div>
          )}
        </div>

        {error && (
          <div className="px-4 py-3 text-sm text-red-500 bg-red-500/5">
            {error}
          </div>
        )}

        {response !== null ? (
          <div className="h-[300px]">
            <CodeEditor
              value={response}
              language={responseLanguage}
              readOnly
              height="100%"
            />
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-text-dim">
            {loading
              ? "Sending request..."
              : "Click \"Send Request\" to see the response"}
          </div>
        )}
      </div>
    </div>
  );
}
