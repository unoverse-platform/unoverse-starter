/**
 * JourneyFinder Node Definition
 * Auto-generated from Unoverse definition
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import JourneyFinderExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "JourneyFinder";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "JourneyFinder",
    description: "A guided learning-journey finder: six quick questions about career stage, current situation, subject area, learning route, study mode and time commitment, with a phase stepper and progress bar. After the last answer it shows an animated searching state with a live status line while matched courses are found, then a results list of recommended courses with fit reasons. The searching-to-results flip is server-driven: the workflow pushes step \"results\" alongside the courses.",
    whenToUse: "Help a user find the right course or learning journey by answering a few quick questions about their goals and study preferences, then hand the collected answers to a course search and present the matched courses. Pick when the outcome is a guided question-and-answer flow that ends in a shortlist of recommended courses.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 1040, height: 760 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "output", type: NodeInputType.OBJECT, description: "Submitted component outputs: careerStage, situation, subject, route, studyMode, commitment" }],
    configSchema: {
      "type": "object",
      "properties": {
            "step": {
                  "type": "string",
                  "title": "step",
                  "default": "careerstage",
                  "ui:field": "template"
            },
            "searchStatus": {
                  "type": "string",
                  "title": "searchStatus",
                  "default": "Matching courses to your goals…",
                  "ui:field": "template"
            },
            "courses": {
                  "type": "array",
                  "title": "courses",
                  "default": [
                        {
                              "badge": "Professional Qualification",
                              "name": "ACCA Qualification",
                              "description": "Become a chartered certified accountant with industry-leading pass rates and expert tutors.",
                              "meta": "Online Classroom Live · Part-time · 24–36 months",
                              "fitReason": "A recognised qualification you can earn while working"
                        },
                        {
                              "badge": "Apprenticeship",
                              "name": "Level 7 Accountancy & Taxation Professional",
                              "description": "A fully funded route to chartered status with structured employer support.",
                              "meta": "Blended · Part-time · 36 months",
                              "fitReason": "Employer-funded, so you can qualify without stepping back from work"
                        },
                        {
                              "badge": "Professional Qualification",
                              "name": "AAT Level 4 Diploma in Professional Accounting",
                              "description": "Deepen your finance skills with a practical, flexible diploma.",
                              "meta": "Online Classroom · Flexible · 12–18 months",
                              "fitReason": "A flexible stepping stone toward full chartered status"
                        }
                  ],
                  "ui:field": "template"
            },
            "heroImage": {
                  "type": "string",
                  "title": "heroImage",
                  "default": "https://res.cloudinary.com/sonik/image/upload/w_1000,ar_2:3,c_fill,g_face,e_art:hokusai/v1782963908/BPP/images/1738752132-woman-conversation-laptop.jpg",
                  "ui:field": "template"
            }
      },
      "required": []
},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const JourneyFinderNode = {
  definition,
  executor: JourneyFinderExecutor,
};

export { createNodeDefinition as default };
