"use strict";
/**
 * Design System Plugin
 * UI Components for Gravity workflow system
 *
 * Generated nodes are imported directly - no dynamic ingestion needed
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_base_1 = require("@gravity-platform/plugin-base");
const package_json_1 = __importDefault(require("../package.json"));
const path = __importStar(require("path"));
// Import generated nodes
const node_1 = require("./AIResponse/node");
const node_2 = require("./AccountTransferWidget/node");
const node_3 = require("./BookingWidget/node");
const node_4 = require("./Card/node");
const node_5 = require("./Card2/node");
const node_6 = require("./CardCarousel/node");
const node_7 = require("./ChatInput/node");
const node_8 = require("./CardFinder/node");
const node_9 = require("./ListPicker/node");
// All design system nodes
const nodes = [
    node_1.AIResponseNode,
    node_2.AccountTransferWidgetNode,
    node_3.BookingWidgetNode,
    node_4.CardNode,
    node_5.Card2Node,
    node_6.CardCarouselNode,
    node_8.CardFinderNode,
    node_7.ChatInputNode,
    node_9.ListPickerNode,
];
const plugin = (0, plugin_base_1.createPlugin)({
    name: package_json_1.default.name,
    version: package_json_1.default.version,
    description: package_json_1.default.description,
    async setup(api) {
        // Register this package's path for component serving
        // __dirname is dist/src, so go up twice to get package root
        const packagePath = path.join(__dirname, "../..");
        if (api.registerComponentPath) {
            api.registerComponentPath(packagePath);
        }
        // Set platform dependencies for this package
        const { setPlatformDependencies } = await Promise.resolve().then(() => __importStar(require("@gravity-platform/plugin-base")));
        setPlatformDependencies({
            PromiseNode: api.classes.PromiseNode,
            CallbackNode: api.classes.CallbackNode,
            NodeInputType: api.types.NodeInputType,
            NodeConcurrency: api.types.NodeConcurrency,
            getNodeCredentials: api.getNodeCredentials,
            getConfig: api.getConfig,
            createLogger: api.createLogger,
            saveTokenUsage: api.saveTokenUsage,
            callService: api.callService,
            getRedisClient: api.getRedisClient,
            gravityPublish: api.gravityPublish,
            executeNodeWithRouting: api.executeNodeWithRouting,
            getAudioWebSocketManager: api.getAudioWebSocketManager,
        });
        // Register all nodes
        for (const node of nodes) {
            api.registerNode(node);
        }
    },
});
exports.default = plugin;
