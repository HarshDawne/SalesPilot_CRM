
import path from 'path';
import fs from 'fs';

const campaignsPath = path.join(process.cwd(), 'data', 'campaigns-v2.json');
const leadsPath = path.join(process.cwd(), 'data', 'campaign-leads.json');

async function main() {
    console.log('CWD:', process.cwd());
    console.log('Campaigns Path:', campaignsPath);

    if (!fs.existsSync(campaignsPath)) {
        console.error('Campaigns file NOT FOUND');
        return;
    }

    const campaignsData = JSON.parse(fs.readFileSync(campaignsPath, 'utf-8'));
    const campaigns = campaignsData.campaigns || [];
    console.log('Total Campaigns:', campaigns.length);

    const active = campaigns.filter((c: any) => c.status !== 'draft');
    console.log('Active Campaigns:', active.map((c: any) => `${c.id} (${c.status})`).join(', '));

    const leadsData = JSON.parse(fs.readFileSync(leadsPath, 'utf-8'));
    const leads = leadsData.leads || [];
    console.log('Total Leads:', leads.length);
}

main();
