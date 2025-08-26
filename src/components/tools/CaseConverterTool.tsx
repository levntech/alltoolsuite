"use client";
import TextToolTemplate from "../templates/TextToolTemplate";
import React from "react";
import { Hash, Type, FileText, Calculator } from "lucide-react";
import { caseConverter } from "@/tools/textTools";

const CaseConverterTool: React.FC = () => {
  // const processCaseConversion = (input: string, options: Record<string, any> = {}) => {
  //   const { caseType = 'upper' } = options;

  //   let output = '';
  //   switch (caseType) {
  //     case 'upper':
  //       output = input.toUpperCase();
  //       break;
  //     case 'lower':
  //       output = input.toLowerCase();
  //       break;
  //     case 'title':
  //       output = input.replace(/\w\S*/g, (txt) =>
  //         txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  //       );
  //       break;
  //     case 'sentence':
  //       output = input.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
  //       break;
  //     case 'camel':
  //       output = input
  //         .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
  //           index === 0 ? word.toLowerCase() : word.toUpperCase()
  //         )
  //         .replace(/\s+/g, '');
  //       break;
  //     case 'pascal':
  //       output = input
  //         .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
  //         .replace(/\s+/g, '');
  //       break;
  //     case 'snake':
  //       output = input.toLowerCase().replace(/\s+/g, '_');
  //       break;
  //     case 'kebab':
  //       output = input.toLowerCase().replace(/\s+/g, '-');
  //       break;
  //     default:
  //       output = input;
  //   }

  //   return {
  //     output,
  //     metadata: {
  //       originalCase: 'mixed',
  //       convertedTo: caseType,
  //       charactersChanged: input.split('').filter((char, i) => char !== output[i]).length
  //     }
  //   };
  // };

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
      processingFunction={caseConverter}
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
