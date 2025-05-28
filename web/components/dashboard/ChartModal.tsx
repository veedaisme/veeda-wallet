import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, subMonths, isSameMonth } from "date-fns";
import { id as idLocale, enUS } from 'date-fns/locale';
import { supabase } from '@/lib/supabaseClient'; 
import { Transaction } from '@/models/transaction'; 
import { Modal } from '@/components/ui/modal'; 
import { ChartContainer } from "@/components/ui/chart";
import * as Recharts from "recharts";
import { formatIDR } from "@/utils/currency"; 
import { getWeekDays, getMonthWeeks } from '@/utils/dateUtils'; 

interface ChartModalProps {
  open: boolean;
  type: "week" | "month" | null;
  onClose: () => void;
  userId?: string | null;
}

const ChartModal: React.FC<ChartModalProps> = ({ open, type, onClose, userId }) => {
  const tDashChart = useTranslations('dashboard');
  const localeStr = useLocale();
  const dateFnsLocale = localeStr === 'id' ? idLocale : enUS;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    if (!open || !type || !userId) return;
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      const now = new Date();
      if (type === "week") {
        const startCurrent = startOfWeek(now, { weekStartsOn: 1 });
        const endCurrent = addDays(startCurrent, 6);
        const startPrev = addDays(startCurrent, -7);
        const endPrev = addDays(startPrev, 6);

        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .gte("date", startPrev.toISOString())
          .lte("date", endCurrent.toISOString());

        if (error) {
          setError("Failed to fetch transactions");
          setLoading(false);
          return;
        }

        const days = getWeekDays(startCurrent, dateFnsLocale);
        const prevDays = getWeekDays(startPrev, dateFnsLocale);
        const currentWeek: Record<string, number> = {};
        const previousWeek: Record<string, number> = {};
        days.forEach(day => (currentWeek[day] = 0));
        prevDays.forEach(day => (previousWeek[day] = 0));

        (data as Transaction[]).forEach(tx => {
          const d = new Date(tx.date);
          if (d >= startCurrent && d <= endCurrent) {
            const label = format(d, "EEE", { locale: dateFnsLocale });
            if (label in currentWeek) currentWeek[label] += tx.amount;
          } else if (d >= startPrev && d <= endPrev) {
            const label = format(d, "EEE", { locale: dateFnsLocale });
            if (label in previousWeek) previousWeek[label] += tx.amount;
          }
        });

        setChartData(
          days.map(day => ({
            name: day,
            current: currentWeek[day] || 0,
            previous: previousWeek[day] || 0,
          }))
        );
      } else if (type === "month") {
        const startCurrent = startOfMonth(now);
        const endCurrent = endOfMonth(now);
        const prevMonth = subMonths(now, 1);
        const startPrev = startOfMonth(prevMonth);
        const endPrev = endOfMonth(prevMonth);

        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .gte("date", startPrev.toISOString())
          .lte("date", endCurrent.toISOString());

        if (error) {
          setError("Failed to fetch transactions");
          setLoading(false);
          return;
        }

        const currentWeeks = getMonthWeeks(startCurrent, endCurrent, dateFnsLocale);
        const prevWeeks = getMonthWeeks(startPrev, endPrev, dateFnsLocale);

        const currentMonth: Record<string, number> = {};
        const previousMonth: Record<string, number> = {};
        currentWeeks.forEach(w => (currentMonth[w.name] = 0));
        prevWeeks.forEach(w => (previousMonth[w.name] = 0));

        (data as Transaction[]).forEach(tx => {
          const d = new Date(tx.date);
          currentWeeks.forEach(w => {
            if (d >= w.start && d <= w.end && isSameMonth(d, startCurrent)) {
              currentMonth[w.name] += tx.amount;
            }
          });
          prevWeeks.forEach(w => {
            if (d >= w.start && d <= w.end && isSameMonth(d, startPrev)) {
              previousMonth[w.name] += tx.amount;
            }
          });
        });

        const allLabels = Array.from(new Set([...currentWeeks.map(w => w.name), ...prevWeeks.map(w => w.name)]));
        setChartData(
          allLabels.map(label => ({
            name: label,
            current: currentMonth[label] || 0,
            previous: previousMonth[label] || 0,
          }))
        );
      }
      setLoading(false);
    };

    fetchData();
  }, [open, type, userId, dateFnsLocale]);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={
        type === "week"
          ? tDashChart('weeklyComparison')
          : type === "month"
          ? tDashChart('monthlyComparison')
          : tDashChart('comparison')
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-center py-8">Loading...</div>
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : type === "week" && chartData.length ? (
        <div className="w-full h-64">
          <ChartContainer config={{
            current: { label: tDashChart('current'), color: "#000000" },
            previous: { label: tDashChart('previous'), color: "#cccccc" }
          }}>
            <Recharts.ResponsiveContainer width="100%" height="100%">
              <Recharts.LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <Recharts.CartesianGrid strokeDasharray="3 3" />
                <Recharts.XAxis dataKey="name" />
                <Recharts.YAxis tickFormatter={(value) => formatIDR(value).split(',')[0]} />
                <Recharts.Tooltip
                  formatter={(value: number) => [formatIDR(value), tDashChart('spent')]}
                  labelFormatter={(label: string) => label}
                />
                <Recharts.Legend />
                <Recharts.Line type="monotone" dataKey="current" name={tDashChart('current')} stroke="#e05d38" strokeWidth={3} dot={{ r: 5, stroke: '#e05d38', strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 7, fill: '#e05d38', stroke: '#fff', strokeWidth: 2 }} />
                <Recharts.Line type="monotone" dataKey="previous" name={tDashChart('previous')} stroke="#cccccc" strokeWidth={2} dot={{ r: 4, stroke: '#cccccc', strokeWidth: 1, fill: '#fff' }} activeDot={{ r: 6, fill: '#cccccc', stroke: '#fff', strokeWidth: 2 }} />
              </Recharts.LineChart>
            </Recharts.ResponsiveContainer>
          </ChartContainer>
        </div>
      ) : type === "month" && chartData.length ? (
        <div className="w-full h-64">
          <ChartContainer config={{
            current: { label: tDashChart('current'), color: "#000000" },
            previous: { label: tDashChart('previous'), color: "#cccccc" }
          }}>
            <Recharts.ResponsiveContainer width="100%" height="100%">
              <Recharts.LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <Recharts.CartesianGrid strokeDasharray="3 3" />
                <Recharts.XAxis dataKey="name" />
                <Recharts.YAxis tickFormatter={(value) => formatIDR(value).split(',')[0]} />
                <Recharts.Tooltip
                  formatter={(value: number) => [formatIDR(value), tDashChart('weeklyTotal')]}
                  labelFormatter={(label: string) => label}
                />
                <Recharts.Legend />
                <Recharts.Line type="monotone" dataKey="current" name={tDashChart('current')} stroke="#e05d38" strokeWidth={3} dot={{ r: 5, stroke: '#e05d38', strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 7, fill: '#e05d38', stroke: '#fff', strokeWidth: 2 }} />
                <Recharts.Line type="monotone" dataKey="previous" name={tDashChart('previous')} stroke="#cccccc" strokeWidth={2} dot={{ r: 4, stroke: '#cccccc', strokeWidth: 1, fill: '#fff' }} activeDot={{ r: 6, fill: '#cccccc', stroke: '#fff', strokeWidth: 2 }} />
              </Recharts.LineChart>
            </Recharts.ResponsiveContainer>
          </ChartContainer>
        </div>
      ) : (
        <div className="text-gray-400">No data available</div>
      )}
    </Modal>
  );
};

export default ChartModal;
