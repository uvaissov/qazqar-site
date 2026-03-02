"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import BrandForm from "./BrandForm";
import ModelForm from "./ModelForm";

interface ModelWithCount {
  id: string;
  name: string;
  slug: string;
  brandId: string;
  _count: {
    cars: number;
  };
}

interface BrandWithModels {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  models: ModelWithCount[];
}

interface BrandsListProps {
  brands: BrandWithModels[];
}

export default function BrandsList({ brands }: BrandsListProps) {
  const router = useRouter();
  const t = useTranslations("adminBrands");

  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandWithModels | null>(null);
  const [addingModelForBrand, setAddingModelForBrand] = useState<string | null>(null);
  const [editingModel, setEditingModel] = useState<ModelWithCount | null>(null);

  const toggleExpand = (brandId: string) => {
    setExpandedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brandId)) {
        next.delete(brandId);
      } else {
        next.add(brandId);
      }
      return next;
    });
  };

  const handleRefresh = () => {
    setShowAddBrand(false);
    setEditingBrand(null);
    setAddingModelForBrand(null);
    setEditingModel(null);
    router.refresh();
  };

  const handleDeleteBrand = async (brand: BrandWithModels) => {
    const hasModelsWithCars = brand.models.some((m) => m._count.cars > 0);
    if (hasModelsWithCars) {
      alert(t("hasCars"));
      return;
    }

    if (!window.confirm(t("confirmDeleteBrand"))) return;

    try {
      const res = await fetch(`/api/admin/brands/${brand.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Error");
      }
    } catch {
      console.error("Delete brand failed");
    }
  };

  const handleDeleteModel = async (model: ModelWithCount) => {
    if (model._count.cars > 0) {
      alert(t("hasCars"));
      return;
    }

    if (!window.confirm(t("confirmDeleteModel"))) return;

    try {
      const res = await fetch(`/api/admin/models/${model.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Error");
      }
    } catch {
      console.error("Delete model failed");
    }
  };

  if (brands.length === 0 && !showAddBrand) {
    return (
      <div>
        <div className="mb-4">
          <button
            onClick={() => setShowAddBrand(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-white text-sm font-medium rounded-lg hover:bg-cyan-600 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            {t("addBrand")}
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
            />
          </svg>
          <p className="text-gray-500">{t("empty")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Brand Button */}
      {!showAddBrand && !editingBrand && (
        <button
          onClick={() => setShowAddBrand(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-white text-sm font-medium rounded-lg hover:bg-cyan-600 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          {t("addBrand")}
        </button>
      )}

      {/* Add Brand Form */}
      {showAddBrand && (
        <BrandForm
          onSave={handleRefresh}
          onCancel={() => setShowAddBrand(false)}
        />
      )}

      {/* Edit Brand Form */}
      {editingBrand && (
        <BrandForm
          brand={editingBrand}
          onSave={handleRefresh}
          onCancel={() => setEditingBrand(null)}
        />
      )}

      {/* Brands List */}
      {brands.map((brand) => {
        const isExpanded = expandedBrands.has(brand.id);
        const totalCars = brand.models.reduce(
          (sum, m) => sum + m._count.cars,
          0
        );

        return (
          <div
            key={brand.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Brand Header */}
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpand(brand.id)}
            >
              <div className="flex items-center gap-3">
                {/* Expand icon */}
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>

                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {brand.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {brand.slug} &middot; {brand.models.length} {t("models")} &middot; {totalCars} {t("carsCount")}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setEditingBrand(brand);
                    setShowAddBrand(false);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                  {t("editBrand")}
                </button>
                <button
                  onClick={() => handleDeleteBrand(brand)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                  {t("deleteBrand")}
                </button>
              </div>
            </div>

            {/* Expanded Section - Models */}
            {isExpanded && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                {/* Add Model Button */}
                {addingModelForBrand !== brand.id && editingModel === null && (
                  <button
                    onClick={() => {
                      setAddingModelForBrand(brand.id);
                      setEditingModel(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 mb-3 text-xs font-medium text-cyan-600 border border-cyan-200 hover:bg-cyan-50 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    {t("addModel")}
                  </button>
                )}

                {/* Add Model Form */}
                {addingModelForBrand === brand.id && (
                  <div className="mb-3">
                    <ModelForm
                      brandId={brand.id}
                      onSave={handleRefresh}
                      onCancel={() => setAddingModelForBrand(null)}
                    />
                  </div>
                )}

                {/* Edit Model Form */}
                {editingModel && editingModel.brandId === brand.id && (
                  <div className="mb-3">
                    <ModelForm
                      brandId={brand.id}
                      model={editingModel}
                      onSave={handleRefresh}
                      onCancel={() => setEditingModel(null)}
                    />
                  </div>
                )}

                {/* Models Table */}
                {brand.models.length > 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">
                            {t("name")}
                          </th>
                          <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">
                            {t("slug")}
                          </th>
                          <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">
                            {t("carsCount")}
                          </th>
                          <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">
                            &nbsp;
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {brand.models.map((model) => (
                          <tr
                            key={model.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-2.5 font-medium text-gray-800">
                              {model.name}
                            </td>
                            <td className="px-4 py-2.5 text-gray-500 text-xs">
                              {model.slug}
                            </td>
                            <td className="px-4 py-2.5 text-gray-500">
                              {model._count.cars}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingModel(model);
                                    setAddingModelForBrand(null);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                    />
                                  </svg>
                                  {t("editModel")}
                                </button>
                                <button
                                  onClick={() => handleDeleteModel(model)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                    />
                                  </svg>
                                  {t("deleteModel")}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    {t("empty")}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
