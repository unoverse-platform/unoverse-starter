import { createPlugin } from "@unoverse-platform/plugin-base";

// GTM go-to-market package: Apollo.io + Hunter.io prospecting, enrichment and verification.
const plugin = createPlugin({
  name: "@unoverse-platform/gtm",
  version: "1.0.0",
  description: "Go-to-market nodes — Apollo.io & Hunter.io people/company search, enrichment and email verification",

  async setup(api) {
    const { initializePlatformFromAPI } = await import("@unoverse-platform/plugin-base");
    initializePlatformFromAPI(api);

    // Apollo.io nodes
    const { ApolloPeopleNode } = await import("./ApolloPeople/node");
    api.registerNode(ApolloPeopleNode);
    const { ApolloCompanyNode } = await import("./ApolloCompany/node");
    api.registerNode(ApolloCompanyNode);
    const { ApolloPeopleEnrichNode } = await import("./ApolloPeopleEnrich/node");
    api.registerNode(ApolloPeopleEnrichNode);
    const { ApolloCompanyEnrichNode } = await import("./ApolloCompanyEnrich/node");
    api.registerNode(ApolloCompanyEnrichNode);

    // Hunter.io nodes
    const { HunterDomainSearchNode } = await import("./HunterDomainSearch/node");
    api.registerNode(HunterDomainSearchNode);
    const { HunterEmailFinderNode } = await import("./HunterEmailFinder/node");
    api.registerNode(HunterEmailFinderNode);
    const { HunterEmailVerifierNode } = await import("./HunterEmailVerifier/node");
    api.registerNode(HunterEmailVerifierNode);
    const { HunterEnrichNode } = await import("./HunterEnrich/node");
    api.registerNode(HunterEnrichNode);
    const { HunterDiscoverNode } = await import("./HunterDiscover/node");
    api.registerNode(HunterDiscoverNode);

    // Credentials
    const { ApolloCredential, HunterCredential } = await import("./credentials");
    api.registerCredential(ApolloCredential);
    api.registerCredential(HunterCredential);
  },
});

export default plugin;
