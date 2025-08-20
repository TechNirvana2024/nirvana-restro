import { useAppSelector } from "@/redux/store/hooks";
import { format, getHours, subDays } from "date-fns";
import { ExternalLink, TrendingDown, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CurrencySign, FRONTEND_BASE_URL } from "@/constants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { dummyTables as tables } from "../../tempDatas/table";
import RestroTable from "@/components/RestroTable";
const trendObj = {
  UP: {
    color: "#40c057",
    icon: <TrendingUp color="#40c057" />,
  },
  DOWN: {
    color: "#f00",
    icon: <TrendingDown color="#f00" />,
  },
};

const getPartOfDay = (date: Date = new Date()): string => {
  const hour = getHours(date); // Get hour (0–23) from the provided or current date
  if (hour >= 0 && hour < 6) return "Night";
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 18) return "Afternoon";
  return "Evening";
};

export default function NewDashboard() {
  return (
    <div>
      <Header />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tables.map((table) => (
          <RestroTable table={table} />
        ))}
      </div>
    </div>
  );
}

function Header() {
  const navigate = useNavigate();
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
          href="https://staging.unimomo.co.uk"
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

function StatsCard({
  icon = "",
  title = "Revenue",
  value = 0,
  percent = 0,
  isPrice = false,
  lastDate = subDays(new Date(), 7),
}) {
  const trend = percent >= 0 ? "UP" : "DOWN";

  return (
    <div className="border border-[#eee8ff] p-5 bg-white flex flex-col gap-3">
      <img className="size-11" src={icon} alt="icon" />
      <div className="text-[#adb5bd] font-semibold text-base text-left">
        {title}
      </div>
      <div className="text-left text-[1.75rem] font-semibold">
        {isPrice && <span>{CurrencySign}</span>} {value}
      </div>
      <div className={`flex items-center gap-2`}>
        {trendObj[trend].icon}
        <div>
          <span className={trend === "UP" ? "text-[#40c057]" : "text-[#f00]"}>
            {Number(percent).toFixed(2) + "%"}{" "}
          </span>
          <span className="text-black">
            from last {format(lastDate, "eeee")}
          </span>
        </div>
      </div>
    </div>
  );
}
