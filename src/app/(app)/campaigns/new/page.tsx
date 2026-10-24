import { PageHeader } from "@/components/app/page-header";
import { CampaignForm } from "./campaign-form";

export default function NewCampaignPage() {
  return (
    <>
      <PageHeader title="New campaign" description="Say who you want to reach and where. The finders use this to go looking; Claude uses it to write the plan." />
      <CampaignForm />
    </>
  );
}
