import ManageRoomDashboard from "@/components/ManageRoom/ManageRoomDashboard";

type ManageRoomPageProps = {
  params: Promise<{
    roomId: string;
  }>;

  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ManageRoomPage({
  params,
  searchParams,
}: ManageRoomPageProps) {
  const {
    roomId,
  } = await params;

  const {
    token,
  } = await searchParams;

  return (
    <ManageRoomDashboard
      roomId={roomId}
      token={token ?? ""}
    />
  );
}
