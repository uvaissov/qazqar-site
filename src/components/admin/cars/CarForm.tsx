"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ImageUpload from "./ImageUpload";

interface CarModel {
  id: string;
  name: string;
  slug: string;
  brandId: string;
  brand: {
    id: string;
    name: string;
    slug: string;
  };
}

interface CarData {
  id: string;
  modelId: string;
  inventoryId: number;
  number: string;
  techPassport: string | null;
  vin: string | null;
  year: number;
  color: string;
  totalDistance: number;
  transmission: string;
  fuelType: string;
  seats: number;
  hasAC: boolean;
  deposit: number;
  status: string;
  photos: { photo: { url: string } }[];
  slug: string;
  descriptionRu: string | null;
  descriptionKz: string | null;
  model: {
    name: string;
    brand: {
      name: string;
      slug: string;
    };
  };
}

interface CarFormProps {
  mode: "create" | "edit";
  car?: CarData;
  models: CarModel[];
}

function generateSlug(
  brandName: string,
  modelName: string,
  year: string,
  color: string
): string {
  return [brandName, modelName, year, color]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function CarForm({ mode, car, models }: CarFormProps) {
  const router = useRouter();
  const t = useTranslations("adminCars");
  const isApiCar = mode === "edit" && (car?.inventoryId ?? 0) > 0;
  const disabledClass = "w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500 cursor-not-allowed";

  const [modelId, setModelId] = useState(car?.modelId || "");
  const [inventoryId, setInventoryId] = useState(car?.inventoryId?.toString() || "0");
  const [number, setNumber] = useState(car?.number || "");
  const [techPassport, setTechPassport] = useState(car?.techPassport || "");
  const [vin, setVin] = useState(car?.vin || "");
  const [year, setYear] = useState(car?.year?.toString() || "");
  const [color, setColor] = useState(car?.color || "");
  const [totalDistance, setTotalDistance] = useState(car?.totalDistance?.toString() || "0");
  const [transmission, setTransmission] = useState(
    car?.transmission || "AUTOMATIC"
  );
  const [fuelType, setFuelType] = useState(car?.fuelType || "AI92");
  const [seats, setSeats] = useState(car?.seats?.toString() || "5");
  const [hasAC, setHasAC] = useState(car?.hasAC ?? true);
  const [deposit, setDeposit] = useState(car?.deposit?.toString() || "0");
  const [status, setStatus] = useState(car?.status || "AVAILABLE");
  const [images, setImages] = useState<string[]>(car?.photos?.map(p => p.photo.url) || []);
  const [slug, setSlug] = useState(car?.slug || "");
  const [descriptionRu, setDescriptionRu] = useState(
    car?.descriptionRu || ""
  );
  const [descriptionKz, setDescriptionKz] = useState(
    car?.descriptionKz || ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Auto-generate slug
  useEffect(() => {
    if (mode === "create") {
      const selectedModel = models.find((m) => m.id === modelId);
      if (selectedModel) {
        setSlug(
          generateSlug(selectedModel.brand.name, selectedModel.name, year, color)
        );
      }
    }
  }, [modelId, year, color, mode, models]);

  // Group models by brand
  const brandGroups: Record<string, { brandName: string; models: CarModel[] }> =
    {};
  for (const model of models) {
    if (!brandGroups[model.brandId]) {
      brandGroups[model.brandId] = {
        brandName: model.brand.name,
        models: [],
      };
    }
    brandGroups[model.brandId].models.push(model);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const body = {
      modelId,
      inventoryId: Number(inventoryId),
      number,
      techPassport: techPassport || null,
      vin: vin || null,
      year: Number(year),
      color,
      totalDistance: Number(totalDistance),
      transmission,
      fuelType,
      seats: Number(seats),
      hasAC,
      deposit: Number(deposit) || 0,
      status,
      images,
      slug,
      descriptionRu: descriptionRu || null,
      descriptionKz: descriptionKz || null,
    };

    try {
      const url =
        mode === "create"
          ? "/api/admin/cars"
          : `/api/admin/cars/${car?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push("/admin/cars");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Main info card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {t("model")}
          </h2>
          {isApiCar && (
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              {t("syncedFromCrm")}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Model select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("model")} *
            </label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              required
              disabled={isApiCar}
              className={isApiCar ? disabledClass : "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"}
            >
              <option value="">--</option>
              {Object.entries(brandGroups).map(
                ([brandId, { brandName, models: brandModels }]) => (
                  <optgroup key={brandId} label={brandName}>
                    {brandModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                )
              )}
            </select>
          </div>

          {/* Car number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("number")} *
            </label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
              disabled={isApiCar}
              placeholder="123ABC01"
              className={isApiCar ? disabledClass : "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"}
            />
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("year")} *
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
              disabled={isApiCar}
              min={2000}
              max={2030}
              placeholder="2024"
              className={isApiCar ? disabledClass : "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("color")} *
            </label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              required
              disabled={isApiCar}
              className={isApiCar ? disabledClass : "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"}
            />
          </div>

          {/* Transmission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("transmission")}
            </label>
            <select
              value={transmission}
              onChange={(e) => setTransmission(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
            >
              <option value="AUTOMATIC">AKPP</option>
              <option value="MANUAL">MKPP</option>
            </select>
          </div>

          {/* Fuel type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("fuelType")}
            </label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
            >
              <option value="AI92">AI-92</option>
              <option value="AI95">AI-95</option>
              <option value="AI98">AI-98</option>
              <option value="DIESEL">Diesel</option>
            </select>
          </div>

          {/* Seats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("seats")}
            </label>
            <input
              type="number"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              min={2}
              max={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
            />
          </div>

          {/* Deposit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Депозит (₸)
            </label>
            <input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              min={0}
              step={1000}
              placeholder="30000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
            />
          </div>

          {/* Status — read-only, managed by CRM sync */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("status")}
            </label>
            <div className={disabledClass}>
              {status === "AVAILABLE" ? t("available") : status === "RENTED" ? t("rented") : t("maintenance")}
            </div>
          </div>

          {/* AC */}
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="hasAC"
              checked={hasAC}
              onChange={(e) => setHasAC(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
            />
            <label
              htmlFor="hasAC"
              className="text-sm font-medium text-gray-700"
            >
              {t("ac")}
            </label>
          </div>
        </div>
      </div>

      {/* Slug */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {t("slug")}
        </h2>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          placeholder="brand-model-year-color"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none font-mono"
        />
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {t("images")}
        </h2>
        <ImageUpload images={images} onChange={setImages} />
      </div>

      {/* Descriptions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {t("descriptionRu")} / {t("descriptionKz")}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("descriptionRu")}
            </label>
            <textarea
              value={descriptionRu}
              onChange={(e) => setDescriptionRu(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("descriptionKz")}
            </label>
            <textarea
              value={descriptionKz}
              onChange={(e) => setDescriptionKz(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-y"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-cyan-500 text-white text-sm font-medium rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving && (
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          {t("save")}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/cars")}
          className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
