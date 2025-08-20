import PageContent from "@/components/PageContent";
import { dummyTables as tables } from "../../tempDatas/table";
import { ExternalLink } from "lucide-react";
import { FRONTEND_BASE_URL } from "@/constants";
import { format, getHours } from "date-fns";
import RestroTable from "@/components/RestroTable";
import { useAppSelector } from "@/redux/store/hooks";

const getPartOfDay = (date: Date = new Date()): string => {
  const hour = getHours(date); // Get hour (0–23) from the provided or current date
  if (hour >= 0 && hour < 6) return "Night";
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 18) return "Afternoon";
  return "Evening";
};

export default function Dashboard() {
  return (
    <PageContent>
      <div>
        <Header />
        <Tables />
      </div>
    </PageContent>
  );
}

function Tables() {
  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {tables.map((table) => (
        <RestroTable table={table} />
      ))}
    </div>
  );
}

function Header() {
  const userName = useAppSelector((state) => state.profile.username);
  const todayDate = format(new Date(), "PPP");
  return (
    <div className="w-full flex justify-between">
      <div className="flex flex-col">
        <div className="text-left text-2xl font-bold">
          Good {getPartOfDay()}, {userName}
        </div>
        <div>
          Here are your stats for today{" "}
          <span className="text-blue-500 font-semibold">{todayDate}</span>
        </div>
      </div>
      <a
        href={FRONTEND_BASE_URL}
        target="_blank"
        className="flex items-center gap-4"
      >
        <a
          href="#"
          target="_blank"
          className=" flex gap-3 text-base font-semibold"
        >
          GOTO YOUR WEBSITE
          <span>
            {" "}
            <ExternalLink className="size-5" />
          </span>
        </a>
      </a>
    </div>
  );
}
