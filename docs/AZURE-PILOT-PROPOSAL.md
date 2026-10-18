# TournamentCam — Azure pilot proposal

Prepared 18 October 2026. Budgetary proposal for one Philippine venue, one court, using the existing application and client-owned Dahua camera/NVR. This is not an Azure deployment or a fixed implementation quote.

## Proposed service

Players can record a match, replay it, download a copy and share an expiring watch link. The existing Angular PWA will be adapted for Azure hosting.

- Azure App Service Linux: application and API.
- Azure Blob Storage, Hot LRS: private match recordings.
- Azure Table Storage: simple match metadata; final schema to be confirmed during implementation.
- Custom domain with HTTPS.
- Venue-side recording agent: captures the Dahua stream locally, queues completed recordings and uploads when connectivity is available.
- Staff authentication, short-lived video access, share-link revocation, usage tracking and storage cleanup.

The camera/NVR stays on the venue network. Do not expose camera RTSP ports publicly. Players access the cloud app; recording commands and upload retries require an authenticated venue-agent integration. These cloud features are proposed development work, not capabilities already deployed.

## Pilot price

Suggested commercial offer: PHP 30,000 implementation allowance, subject to a hardware test and a bounded statement of work. Use the existing prototype; do not treat this as a rebuild. This is a proposed seller price, not a researched market rate or a guarantee that all production requirements fit this budget.

Include one venue, one court, one camera integration, basic branding, cloud configuration, staff access, queued uploads, match library, replay/download/sharing, 14-day video cleanup, acceptance testing and remote staff handover. Validate effort before committing to the fixed price. If the actual integration exceeds the allowance, reduce scope or agree a change order before proceeding.

Exclude cameras, NVR, recording computer, disks, installation/cabling, travel, venue internet, electricity, automatic highlights, ball tracking, PTZ, payment processing, multi-venue administration and 24/7 support. Existing NVR capacity does not prove that an additional recording computer is unnecessary; verify the model and workflow.

Optional maintenance: PHP 1,500/month for up to two hours of remote support during agreed business hours. Additional work and onsite visits quoted separately. Azure charges remain separate and payable by the client.

## Monthly cloud budget

Planning case: one court, 4 recorded hours/day, 30 days/month, average encoded bitrate 4 Mbps, automatic deletion after 14 days, one complete playback/download equivalent per recording. A playback plus a download counts as two equivalents. Extra viewers add traffic.

USD figures are allowances unless explicitly identified as published prices. PHP equivalents use a budgeting assumption of PHP 60 per USD, NOT a verified current exchange rate. Actual subscription billing, taxes, card conversion and regional pricing prevail.

| Cost | USD/month | PHP/month planning equivalent |
| --- | ---: | ---: |
| App Service Linux, small single instance | 20–40 | 1,200–2,400 |
| Blob capacity, approximately 101 GB retained | 3–5 | 180–300 |
| Internet egress, approximately 216 GB delivered | 13.92 | 835 |
| Metadata, storage operations and secrets | 3–8 | 180–480 |
| Capped logs and monitoring | 3–10 | 180–600 |
| Domain amortized and DNS allowance | 1.50–2 | 90–120 |
| Estimated total | 44.42–78.92 | 2,665–4,735 |

Recommend a PHP 3,000–6,000 monthly CLOUD budget, allowing headroom for billing differences and some additional traffic. This is not an unlimited usage plan and is not a hard Azure spending cap. With optional PHP 1,500 maintenance, plan PHP 4,500–7,500/month in recurring costs, excluding venue operating expenses.

The App Service allowance assumes a small Linux plan; verify the actual Southeast Asia (Singapore) SKU price and capacity before purchase. This design keeps video transcoding off App Service and serves video directly from Blob Storage using controlled access. It does not promise high availability or a production SLA.

Azure publicly lists App Service Domains at USD 11.99/year for supported domains; confirm availability and checkout price. Domain registration is paid annually rather than monthly. Use an eligible managed HTTPS certificate where available.

## Usage calculations

At 4 Mbps, one video hour is approximately 1.8 GB (decimal units):

- New recordings: 1 court × 4 hours × 30 days × 1.8 GB = 216 GB/month.
- Retained recordings at steady state: 4 hours × 14 days × 1.8 GB = 100.8 GB.
- One viewing/download equivalent: 216 GB/month delivered.
- Asia premium-network egress estimate: (216 − 100) × USD 0.12 = USD 13.92/month, assuming the published first 100 GB monthly allowance remains available for this subscription's traffic.
- Two equivalents: 432 GB delivered; approximately USD 39.84 egress instead. Increment: USD 25.92, or approximately PHP 1,555 at the planning conversion.

These numbers assume a measured average output bitrate of 4 Mbps. The existing FFmpeg command does not fix output at that bitrate. Measure and, if appropriate, configure encoding during the pilot. Higher bitrate, more hours, longer retention, soft-delete retention and additional copies increase storage and delivery costs.

Actual monthly averages vary during the initial ramp-up. If videos are not deleted, storage grows every month. The current app expires sharing links but does not delete recordings: an explicit, communicated video retention policy and cleanup implementation are required for these estimates. Match owners must know when downloads will cease to be available.

## Delivery and acceptance

1. Confirm exact Dahua camera/NVR models, usable recording computer, court angle, upload speed and pilot scope.
2. Configure resources in the client's Azure subscription, select a domain and verify the regional estimate before purchase.
3. Implement Azure storage/metadata integration and the authenticated venue recording/upload agent.
4. Configure staff access, secure playback, retention and cost alerts. Alerts notify staff; they do not automatically prevent Azure charges.
5. Test real capture, replay/seek, downloads, remote sharing, revocation, interrupted uploads and recording during internet loss.
6. Train staff and review actual storage/egress during the pilot before expanding courts.

No Azure resources have been purchased or provisioned by this proposal. No domain has been registered. A client subscription and authorized access, domain choice, and exact hardware details are needed for deployment.

## Client-facing summary

“We propose an Azure-connected one-court pilot using the application already built and your existing Dahua equipment. Allow PHP 30,000 for implementation, subject to equipment validation and agreed scope. Cloud running costs are budgeted at PHP 3,000–6,000 per month for the specified recording and viewing allowance. Optional remote maintenance is PHP 1,500 per month. Recordings are captured at the venue and uploaded for replay and sharing; hardware, internet, travel and additional features are separate.”

## Pricing references

Checked during the estimate discussion; reconfirm selected regional prices before procurement.

- App Service and supported domain pricing: https://azure.microsoft.com/en-us/pricing/details/app-service/linux/
- Blob capacity and operations: https://azure.microsoft.com/en-us/pricing/details/storage/blobs/
- Internet egress: https://azure.microsoft.com/en-us/pricing/details/bandwidth/
- DNS: https://azure.microsoft.com/en-us/pricing/details/dns/
- Final regional estimate: https://azure.microsoft.com/en-us/pricing/calculator/

Published Asia internet egress rates exclude Azure China. The proposed hosting location is Singapore for a Philippine venue, subject to client requirements and availability. No exchange-rate or Philippine market-rate claim is made.
