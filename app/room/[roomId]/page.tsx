import RoomChat from "@/components/Chat/RoomChat";

type RoomPageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export default async function RoomPage({
  params,
}: RoomPageProps) {
  const { roomId } = await params;

  return <RoomChat roomId={roomId} />;
}
