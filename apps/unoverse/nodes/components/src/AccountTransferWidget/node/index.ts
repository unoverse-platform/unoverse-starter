/**
 * AccountTransferWidget Node Definition
 * Auto-generated from Unoverse definition
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import AccountTransferWidgetExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "AccountTransferWidget";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "AccountTransferWidget",
    description: "An interactive bank-transfer widget: step through choosing a source account, picking a beneficiary, entering an amount and memo, reviewing the transfer, and a success confirmation — with a step progress bar and a hero image. Renders the account and beneficiary lists, the entered amount and fee, and a confirmation number.",
    whenToUse: "Walk a user through sending money or paying a beneficiary — choose a source account, pick a recipient, enter an amount, review, and confirm. Pick when the outcome is a multi-step money-movement flow that ends in a transfer confirmation.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 1040, height: 720 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }],
    configSchema: {
      "type": "object",
      "properties": {
            "transferData": {
                  "type": "object",
                  "title": "transferData",
                  "default": {
                        "sourceAccount": {
                              "accountName": "Salary Account",
                              "accountNumber": "SA0380000000600100010001",
                              "bankName": "Saudi Awwal Bank",
                              "balance": "SAR 24,500.00",
                              "currency": "SAR"
                        },
                        "recipientAccount": {
                              "accountName": "Ahmed Al-Rashid",
                              "accountNumber": "SA1234567890123210",
                              "bankName": "Saudi Awwal Bank",
                              "currency": "SAR"
                        },
                        "amount": "1,500.00",
                        "currency": "SAR",
                        "reference": "",
                        "transferType": "domestic",
                        "fee": "SAR 2.50",
                        "status": "draft"
                  },
                  "ui:field": "template"
            },
            "availableAccounts": {
                  "type": "array",
                  "title": "availableAccounts",
                  "default": [
                        {
                              "accountName": "Salary Account",
                              "accountNumber": "SA0380000000600100010001",
                              "bankName": "Saudi Awwal Bank",
                              "balance": "SAR 24,500.00",
                              "currency": "SAR"
                        },
                        {
                              "accountName": "Everyday Account",
                              "accountNumber": "SA0380000000600100010042",
                              "bankName": "Saudi Awwal Bank",
                              "balance": "SAR 8,300.50",
                              "currency": "SAR"
                        },
                        {
                              "accountName": "Savings Account",
                              "accountNumber": "SA0380000000600100010098",
                              "bankName": "Saudi Awwal Bank",
                              "balance": "SAR 51,200.00",
                              "currency": "SAR"
                        }
                  ],
                  "ui:field": "template"
            },
            "beneficiaries": {
                  "type": "array",
                  "title": "beneficiaries",
                  "default": [
                        {
                              "id": "ben-ahmed",
                              "name": "Ahmed Al-Rashid",
                              "accountNumber": "SA1234567890123210",
                              "bankName": "Saudi Awwal Bank",
                              "type": "domestic",
                              "currency": "SAR"
                        },
                        {
                              "id": "ben-sara",
                              "name": "Sara Khan",
                              "accountNumber": "SA9876543210008899",
                              "bankName": "Al Rajhi Bank",
                              "type": "domestic",
                              "currency": "SAR"
                        },
                        {
                              "id": "ben-omar",
                              "name": "Omar Hassan",
                              "accountNumber": "SA5566778899004455",
                              "bankName": "Riyad Bank",
                              "type": "domestic",
                              "currency": "SAR"
                        }
                  ],
                  "ui:field": "template"
            },
            "heroImage": {
                  "type": "string",
                  "title": "heroImage",
                  "default": "https://res.cloudinary.com/sonik/image/upload/v1767543207/SAB/travel.jpg",
                  "ui:field": "template"
            }
      },
      "required": []
},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const AccountTransferWidgetNode = {
  definition,
  executor: AccountTransferWidgetExecutor,
};

export { createNodeDefinition as default };
