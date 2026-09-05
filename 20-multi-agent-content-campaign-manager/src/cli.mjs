import {readFile} from 'node:fs/promises';
import {buildWorkGraph,allocateBudget,draftAssets,reviewAsset,buildCampaignPacket,buildPublishingHandoff,buildExperimentHandoff,appendAudit,buildManifest} from './core.mjs';
const path=process.argv[2];if(!path)throw new Error('usage: node src/cli.mjs <campaign.json>');const brief=JSON.parse(await readFile(path,'utf8'));
const graph=buildWorkGraph(brief),budget=allocateBudget(brief,{linkedin:.45,x:.15,email:.4}),drafts=draftAssets(brief,brief.claims);
const roles=['marketing_owner','brand_reviewer','compliance_reviewer'];const reviews=[];for(const asset of drafts.assets)for(const [i,role] of roles.entries())reviews.push(reviewAsset(brief,asset,{reviewerId:`reviewer-${i+1}`,reviewerRole:role,decision:'approve',rationale:'Synthetic demo review only.',reviewedAt:`2026-04-01T15:0${i+2}:00Z`}));
const packet=buildCampaignPacket(brief,graph,drafts,budget,reviews),publishingHandoff=buildPublishingHandoff(brief,packet,drafts),experimentHandoff=buildExperimentHandoff(brief,packet),audit=brief.auditEvents.reduce((a,e)=>appendAudit(a,e),[]),manifest=buildManifest(brief,graph,drafts,budget,packet,audit,publishingHandoff,experimentHandoff);
console.log(JSON.stringify({graph,budget,drafts,reviews,packet,publishingHandoff,experimentHandoff,manifest},null,2));
