"use client";
import TextToolTemplate from "../templates/TextToolTemplate";
import React from "react";
import { Hash, Type, FileText, Calculator } from "lucide-react";
import { caseConverterLogic } from "@/tools/textTools";

const CaseConverterTool: React.FC = () => {
  const processingOptions = [
    {
      key: "caseType",
      label: "Conversion Type",
      type: "select" as const,
      defaultValue: "upper",
      options: [
        { value: "upper", label: "UPPERCASE" },
        { value: "lower", label: "lowercase" },
        { value: "title", label: "Title Case" },
        { value: "sentence", label: "Sentence case" },
        { value: "camel", label: "camelCase" },
        { value: "pascal", label: "PascalCase" },
        { value: "snake", label: "snake_case" },
        { value: "kebab", label: "kebab-case" },
      ],
    },
  ];

  return (
    <TextToolTemplate
      title="Case Converter"
      description="Convert text between different letter cases and formats"
      category="Text Formatting"
      icon={<Type className="w-5 h-5" />}
      processingFunction={caseConverterLogic}
      processingOptions={processingOptions}
      placeholder="Enter text to convert between different cases..."
      features={{
        showStats: false,
        showLivePreview: true,
        enableExport: true,
        enableCopy: true,
        showProcessingOptions: true,
      }}
    />
  );
};

export default CaseConverterTool;
