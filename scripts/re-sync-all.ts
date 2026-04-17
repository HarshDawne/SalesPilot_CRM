
import { CampaignSyncService } from '../src/modules/communication/services/campaign-sync.service';
import { CampaignService } from '../src/modules/communication/services/campaign.service';

async function main() {
    console.log('Starting global re-sync of all campaigns to fix cost/duration data...');
    try {
        const result = await CampaignSyncService.syncAllCampaigns();
        console.log('Global Sync Complete!');
        console.log(`Synced: ${result.synced}`);
        console.log(`Errors: ${result.errors}`);
        console.log('Results:', JSON.stringify(result.results, null, 2));
    } catch (error) {
        console.error('Fatal error during sync:', error);
    }
}

main();
