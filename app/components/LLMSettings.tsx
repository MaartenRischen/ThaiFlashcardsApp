import { useEffect, useState } from "react";

const LLM_BRANDS = [
  { label: "Google (Gemini)", value: "google" },
  { label: "OpenAI", value: "openai" },
  { label: "Anthropic", value: "anthropic" },
  { label: "OpenRouter", value: "openrouter" },
  { label: "HuggingFace", value: "huggingface" },
];

const LLM_MODELS: Record<string, { label: string; value: string; paid: boolean; recommended?: boolean }[]> = {
  google: [
    { label: "Gemini 2.0 Flash Lite (Free, Recommended)", value: "gemini-2.0-flash-lite", paid: false, recommended: true },
    { label: "Gemini Pro (Free)", value: "gemini-pro", paid: false },
  ],
  openai: [
    { label: "GPT-4o (Paid, Recommended)", value: "gpt-4o", paid: true, recommended: true },
    { label: "GPT-4 (Paid)", value: "gpt-4", paid: true },
    { label: "GPT-3.5 Turbo (Paid)", value: "gpt-3.5-turbo", paid: true },
  ],
  anthropic: [
    { label: "Claude 3 (Paid, Recommended)", value: "claude-3", paid: true, recommended: true },
  ],
  openrouter: [
    { label: "Mixtral-8x7B (Free)", value: "mixtral-8x7b", paid: false, recommended: true },
    { label: "MythoMax (Free)", value: "mythomax", paid: false },
    { label: "Any Premium (Paid)", value: "premium", paid: true },
  ],
  huggingface: [
    { label: "Llama-2 (Free)", value: "llama-2", paid: false },
    { label: "Mistral (Free)", value: "mistral", paid: false },
  ],
};

export interface LLMSettings {
  brand: string;
  model: string;
  apiKey?: string;
}

export function LLMSettingsSelector({ onChange }: { onChange: (settings: LLMSettings) => void }) {
  const [brand, setBrand] = useState<string>(() => localStorage.getItem("llmBrand") || "google");
  const [model, setModel] = useState<string>(() => localStorage.getItem("llmModel") || "gemini-2.0-flash-lite");
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("llmApiKey") || "");

  useEffect(() => {
    localStorage.setItem("llmBrand", brand);
    localStorage.setItem("llmModel", model);
    if (apiKey) localStorage.setItem("llmApiKey", apiKey);
    else localStorage.removeItem("llmApiKey");
    onChange({ brand, model, apiKey: apiKey || undefined });
  }, [brand, model, apiKey, onChange]);

  const models = LLM_MODELS[brand] || [];
  const selectedModel = models.find(m => m.value === model) || models[0];
  const isPaid = selectedModel?.paid;

  return (
    <div className="mb-4 p-4 bg-gray-800 rounded-lg">
      <div className="mb-2 font-semibold">AI Model Settings</div>
      <div className="flex flex-col gap-2">
        <label>
          Brand:
          <select
            className="ml-2 p-1 rounded bg-gray-700 text-white"
            value={brand}
            onChange={e => {
              setBrand(e.target.value);
              setModel(LLM_MODELS[e.target.value][0]?.value || "");
            }}
          >
            {LLM_BRANDS.map(b => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </label>
        <label>
          Model:
          <select
            className="ml-2 p-1 rounded bg-gray-700 text-white"
            value={model}
            onChange={e => setModel(e.target.value)}
          >
            {models.map(m => (
              <option key={m.value} value={m.value}>
                {m.label} {m.recommended ? "(Recommended)" : ""}
              </option>
            ))}
          </select>
        </label>
        {isPaid && (
          <label className="flex flex-col mt-2">
            <span>API Key (required for paid models):</span>
            <input
              type="password"
              className="p-1 rounded bg-gray-700 text-white mt-1"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Enter your API key"
            />
          </label>
        )}
      </div>
    </div>
  );
} 