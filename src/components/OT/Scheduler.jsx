import React, { useEffect, useRef, useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  parse,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  getYear,
  setYear,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X as XIcon,
  Search,
  X,
  Trash2,
  ChevronDown,
} from "lucide-react";
import CreateSchedule from "./CreateSchedule";
import axios from "axios";
import CustomDropdown from "../CustomDropdown/CustomDropdown";
import CustomDropdown3 from "../CustomDropdown/CustomDropdown3";
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

export default function Scheduler({
  initialDate = new Date(),
}) {


  const eventRefs = useRef({});
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [view, setView] = useState("week");
  const [openForm, setOpenForm] = useState(false);

  const [schedules, setSchedules] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hours, setHours] = useState([]);

  const [selectedEvent, setSelectedEvent] = useState()

  const [selectedSearchedEvent, setSelectedSearchedEvent] = useState()

  const [ot, setOt] = useState([])
     const [selectedOT, setSelectedOT] = useState(null)

    const fetchOT = async () => {
  try {
    const { data } = await axios.get(
      `${VITE_APP_SERVER}/api/v1/hospital-master/ot-master`
    );
    const list = data.data || [];
    setOt(list);
    // pick the first OT initially
    if (list.length > 0) setSelectedOT(list[0]);
  } catch (err) {
    console.error(err);
  }
};

    
      useEffect(() => {
        fetchOT();
      }, []);

  //navigation helpers
  const goToToday = () => setCurrentDate(new Date());
  const goPrev = () =>
    setCurrentDate(
      view === "month" ? subMonths(currentDate, 1) : addDays(currentDate, -7)
    );
  const goNext = () =>
    setCurrentDate(
      view === "month" ? addMonths(currentDate, 1) : addDays(currentDate, 7)
    );
  const changeYear = (yr) => setCurrentDate(setYear(currentDate, Number(yr)));

  function getColorByWeekday(date) {
    // Sunday=0 … Saturday=6
    switch (date.getDay()) {
      case 1:
        return "bg-orange-300"; // Monday
      case 2:
        return "bg-sky-300"; // Tuesday
      case 3:
        return "bg-green-300"; // Wednesday
      case 4:
        return "bg-purple-300"; // Thursday
      case 5:
        return "bg-blue-300"; // Friday
      case 6:
        return "bg-amber-300"; // Saturday
      default:
        return "bg-red-200"; // Sunday
    }
  }

const fetchSchedules = async () => {
  if (!selectedOT?._id) return;   // ⬅ guard
  try {
    setLoading(true);
    const { data } = await axios.get(
      `${VITE_APP_SERVER}/api/v1/schedules/ot/${selectedOT._id}`
    );
    setSchedules(data.data);
    const evts = data.data.map((sch) => {
      const startDt = parse(sch.startDateTime, "yyyy-MM-dd hh:mm a", new Date());
      const bg = getColorByWeekday(startDt);
      const borderC = bg.replace(/^bg-/, "border-");
      return {
        id: sch._id,
        title: sch.surgeryName,
        start: startDt,
        end: parse(sch.endDateTime, "yyyy-MM-dd hh:mm a", new Date()),
        doctorName: sch.doctorId?.doctorName || "N/A",
        patientName: sch.patientId?.identityDetails?.patientName || "N/A",
        admissionId: sch.admissionId, 
        colorBg: bg,
        colorBorder: borderC,
      };
    });
    setEvents(evts);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchSchedules();
  }, [selectedOT?._id]);

  useEffect(() => {
    if (!events.length) return;
    const starts = events.map((e) => e.start.getHours());
    const ends = events.map((e) => e.end.getHours());
    const minH = Math.min(4, ...starts); // never go higher than 4 AM
    const maxH = Math.max(20, ...ends); // never lower than 8 PM
    setHours(Array.from({ length: maxH - minH + 1 }, (_, i) => minH + i));
  }, [events]);

  const deleteSchedule = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this schedule?");
    if (!ok) return;        
  
    try {
      const res = await axios.delete(
        `${VITE_APP_SERVER}/api/v1/schedules/${id}`
      );
      
      await fetchSchedules();
    } catch (err) {
      console.error("Delete failed", err);
      alert(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="w-full h-[90vh] flex flex-col font-inter text-sm select-none rounded-[10px] relative ">

      {openForm && (
        <CreateSchedule
          setOpenForm={setOpenForm}
          selectedOT={selectedOT}
          fetchSchedules={fetchSchedules}
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
        />
      )}

      <Sidebar
        date={currentDate}
        setDate={setCurrentDate}
        changeYear={changeYear}
        events={events}
        setOpenForm={setOpenForm}
        selectedOT={selectedOT}
        selectedEvent={selectedEvent}
        setSelectedEvent={setSelectedEvent}
        deleteSchedule={deleteSchedule}
        ot={ot}                       
        setSelectedOT={setSelectedOT}       
      />

      <section className="w-full h-[60vh] flex-1 flex flex-col bg-white overflow-hidden">
        <Toolbar
          view={view}
          setView={setView}
          goPrev={goPrev}
          goNext={goNext}
          goToday={goToToday}
          events={events}
          onEventSelect={(ev) => {
            setSelectedSearchedEvent(ev);
            setCurrentDate(ev.start);
          }}
          selectedSearchedEvent={selectedSearchedEvent}
          eventRefs={eventRefs}
        />

        <div className="flex-1 overflow-auto">
          {view === "week" && (
            <WeekView date={currentDate} events={events} hours={hours} selectedSearchedEvent={selectedSearchedEvent} eventRefs={eventRefs} />
          )}
          {view === "day" && (
            <DayView date={currentDate} events={events} hours={hours} selectedSearchedEvent={selectedSearchedEvent} eventRefs={eventRefs} />
          )}
          {view === "month" && <MonthView date={currentDate} events={events} selectedSearchedEvent={selectedSearchedEvent} eventRefs={eventRefs} />}
        </div>
      </section>
    </div>
  );
}

function Sidebar({
  date,
  setDate,
  changeYear,
  events,
  setOpenForm,
  selectedOT,
  selectedEvent,
  setSelectedEvent,
  deleteSchedule,
  ot,                 
  setSelectedOT, 
}) 


{
  const [openOTList, setOpenOTList] = useState(false)
  return (
    <aside className="w-full h-[40vh] overflow-y-scroll scrolll bg-[#18181B] text-white flex gap-10 p-4">

      <div className="w-[40%] h-full  ">

      
      <div className="w-full relative flex justify-between items-center  mb-6">

        <div className="flex gap-x-3 ">
          <p className="font-bold text-[30px] text-white ">{selectedOT?.otName ?? "Select OT"}</p>  
            <ChevronDown  onClick={()=>setOpenOTList(!openOTList)} className="mt-3 "/>
        </div>

       {openOTList && (
            <div className="absolute w-[200px] top-10 z-20">
             
              <CustomDropdown3
  label="Select OT"
  options={ot} // pass raw OT objects [{ _id, otName, ...}]
  selected={selectedOT?._id} // can pass value or the whole selectedOT object
  getOptionLabel={(o) => o?.otName}
  getOptionValue={(o) => o?._id}
  onChange={(value, option) => {
    // value = _id, option = original OT object
    setSelectedOT(option || null);
  }}
/>
            </div>
          )}
       

        <button
          onClick={() => setOpenForm(true)}
          className="w-[32px] h-[28px] rounded-[8px] cursor-pointer bg-[#FFFFFF1A] text-white text-[20px]  "
        >
          +
        </button>
      </div>

      {/* month nav */}
      <header className="flex items-center justify-between mb-1">
        <div className="text-[30px] font-medium">
          {format(date, "MMMM yyyy")}
        </div>

        <div className="flex gap-x-5">

        
        <button
          onClick={() => setDate(subMonths(date, 1))}
          className="p-1 rounded hover:bg-zinc-700/60"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => setDate(addMonths(date, 1))}
          className="p-1 rounded hover:bg-zinc-700/60"
        >
          <ChevronRight size={18} />
        </button>
        </div>
      </header>

      <select
        value={getYear(date)}
        onChange={(e) => changeYear(e.target.value)}
        className="w-full bg-zinc-800 rounded p-1 text-center mb-3"
      >
        {Array.from({ length: 5 }, (_, i) => 2023 + i).map((yr) => (
          <option key={yr}>{yr}</option>
        ))}
      </select>

      <MiniCalendar
        monthDate={date}
        selectedDate={date}
        onSelectDate={setDate}
        events={events}
      />
      </div>

      <div className="w-[60%] h-full  overflow-y-scroll scrolll ">
        <UpcomingList events={events} selectedEvent={selectedEvent} setOpenForm={setOpenForm}
          setSelectedEvent={setSelectedEvent} deleteSchedule={deleteSchedule}/>
      </div>
    </aside>
  );
}

function Toolbar({ view, setView, goPrev, goNext, goToday, events, onEventSelect, selectedSearchedEvent, eventRefs }) {

  const [searchQuery, setSearchQuery] = useState("");

  // 2) filter on title, doctorName or patientName
  const filtered = events.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.doctorName.toLowerCase().includes(q) ||
      e.patientName.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
  if (!selectedSearchedEvent) return;
  const el = eventRefs.current[selectedSearchedEvent.id];
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}, [selectedSearchedEvent]);

  return (
    <div className="px-4 py-4  flex justify-between items-center ">
      <div className="flex items-center gap-0.5 ">
        <button onClick={goPrev} className="px-1 h-[28px] bg-[#F4F4F5] rounded">
          <ChevronLeft size={18} color="#18181B" />
        </button>
        <button
          onClick={goToday}
          className="px-3 h-[28px] rounded text-[#18181B] text-[12px] font-normal bg-[#F4F4F5]"
        >
          Today
        </button>
        <button onClick={goNext} className="px-1 h-[28px] bg-[#F4F4F5] rounded">
          <ChevronRight size={18} color="#18181B" />
        </button>
      </div>

      <div className="inline-flex  rounded text-[14px] font-medium overflow-hidden">
        {[
          ["day", "Day"],
          ["week", "Week"],
          ["month", "Month"],
        ].map(([val, label]) => (
          <button
            key={val}
            className={`${
              view === val
                ? "bg-[#6F3CDB] text-white rounded-[8px] "
                : "text-[#71717A] "
            } px-3 py-1 cursor-pointer `}
            onClick={() => setView(val)}
          >
            {label}
          </button>
        ))}
      </div>

<div className="relative ml-4">
        <Search
          size={16}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-[#18181B]"
        />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search"
          className="pl-8 pr-2 w-[184px] h-[28px] rounded-[4px] py-1 bg-[#F4F4F5] text-xs focus:outline-none focus:ring-1 focus:ring-[#6F3CDB]"
        />

        {/* 3) dropdown of matches */}
        {searchQuery && (
          <div className="absolute top-full mt-1 left-0 w-full bg-white shadow-lg rounded max-h-60 overflow-auto z-20">
            {filtered.length > 0 ? (
              filtered.map((ev) => (
                <div
                  key={ev.id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs"
                  onClick={() => { onEventSelect(ev); setSearchQuery("");}}
                >
                  {/* format date & show details */}
                  {format(ev.start, "MMM d, h:mm a")} – {ev.title} (
                  Dr. {ev.doctorName})
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-xs">
                No events found
              </div>
            )}
          </div>
        )}
      </div>

      {/* <div className="" />
      <button className="flex justify-center items-center cursor-pointer w-[28px] h-[28px] bg-[#DF0408]  text-white  rounded-full">
        <X size={18} onClick={() => setScheduleOpen(false)} />
      </button> */}
    </div>
  );
}

function WeekView({ date, events, hours, selectedSearchedEvent, eventRefs }) {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const eventsForDay = (day) => events.filter((e) => isSameDay(e.start, day));

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}
    >
      {/* hours gutter */}
      <div className=" bg-white">
        {hours.map((hr) => (
          <div
            key={hr}
            className="h-16  flex items-start justify-end pr-1 text-[11px] text-[#71717A]"
          >
            {format(new Date().setHours(hr, 0, 0, 0), "h a")}
          </div>
        ))}
      </div>

      {days.map((day) => (
        <div key={day} className="border-r border-[#D8D8D8] relative">
          <div className="h-12 flex items-center justify-center border-b border-[#D8D8D8] font-bold text-[#71717A] text-[10px] bg-white">
            {format(day, "EEE d")}
          </div>

          {hours.map((hr) => (
            <div
              key={hr}
              className="h-16 border-b border-[#D8D8D8] hover:bg-indigo-50/20"
            />
          ))}

          {eventsForDay(day).map((ev) => (
            <EventBlock key={ev.id} event={ev} hours={hours} selectedSearchedEvent={selectedSearchedEvent} eventRefs={eventRefs}/>
          ))}
        </div>
      ))}
    </div>
  );
}

function DayView({ date, events, hours, selectedSearchedEvent, eventRefs }) {
  const dayEvents = events.filter((e) => isSameDay(e.start, date));
  return (
    <div className="grid" style={{ gridTemplateColumns: "60px 1fr" }}>
      <div className=" bg-white">
        {hours.map((hr) => (
          <div
            key={hr}
            className="h-16  flex items-start justify-end pr-1 text-[11px] text-[#71717A]"
          >
            {format(new Date().setHours(hr, 0, 0, 0), "h a")}
          </div>
        ))}
      </div>
      <div className="relative">
        {hours.map((hr) => (
          <div key={hr} className="h-16  hover:bg-indigo-50/20" />
        ))}
        {dayEvents.map((ev) => (
          <EventBlock key={ev.id} event={ev} hours={hours} selectedSearchedEvent={selectedSearchedEvent} eventRefs={eventRefs} />
        ))}
      </div>
    </div>
  );
}

function MonthView({ date, events, selectedSearchedEvent, eventRefs  }) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  

  const rows = [];
  let day = startDate;

  while (day <= endDate) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const formatted = format(day, "d");
      const dayEvents = events.filter((e) => isSameDay(e.start, day));

      days.push(
        <div
          key={day}
          className={`h-28 border border-[#D8D8D8] p-1 overflow-y-scroll scrolll2 relative ${
            !isSameMonth(day, monthStart) && "bg-gray-50"
          }`}
        >
          <div className="text-[14px] font-medium text-gray-700 mb-1">
            {formatted}
          </div>

          {/* show up to 3 events per day */}
          {dayEvents.map((ev) => {
            const t0 = format(ev.start, "h:mm a");
            const t1 = format(ev.end, "h:mm a");
            const isSelected = selectedSearchedEvent?.id === ev.id;
            return (
              <div 
             ref={el => {
    if (el) {
      eventRefs.current[ev.id] = el;
    } else {
      delete eventRefs.current[ev.id];
    }
  }}
                key={ev.id}
                className={`truncate rounded px-1 py-[1px] mb-[2px] text-[10px] border-l-[4px] ${
        isSelected ? "ring-2 ring-indigo-500" : ""
      } ${ev.colorBorder}  ${ev.colorBg}`}
              >
                {t0}–{t1} <br></br>
                {ev.title}
              </div>
            );
          })}
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day} className="grid grid-cols-7 min-h-[7rem]">
        {days}
      </div>
    );
  }
  return <>{rows}</>;
}

// ───────────────────────────────────────────────────────────── util components
function MiniCalendar({ monthDate, selectedDate, onSelectDate, events }) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const rows = [];
  let day = weekStart;
  while (day <= weekEnd) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const dayEvents = events?.filter((e) => isSameDay(e.start, day));

      days.push(
        <div
          key={cloneDay.toISOString()}
          className={` flex flex-col items-center justify-center h-8 w-8 text-xs rounded-full cursor-pointer transition
            ${!isSameMonth(day, monthStart) ? "text-zinc-500/40" : "text-white"}
            ${
              isSameDay(day, selectedDate)
                ? "bg-[#FB8C5C]"
                : "hover:bg-zinc-700/60"
            }`}
          onClick={() => onSelectDate(cloneDay)}
        >
          {format(day, "d")}
          {dayEvents?.length > 0 && (
            <div className="mt-1 h-1 w-1 rounded-full bg-white z-10" />
          )}
        </div>
      );

      day = addDays(day, 1); // ⬅ move this inside the loop
    }

    rows.push(
      <div
        key={day.toISOString()}
        className="grid grid-cols-7 gap-y-1 place-items-center"
      >
        {days}
      </div>
    );
  }

  return (
    // <div className="grid grid-cols-7 gap-x-3 gap-y-1 place-items-center mb-4">
    //   {["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"].map((d) => (
    //     <div key={d} className="text-[#71717A] font-semibold text-[10px]">
    //       {d}
    //     </div>
    //   ))}
    //   {rows}
    // </div>
    <div className="mb-4">
    {/* Weekday header */}
    <div className="grid grid-cols-7 place-items-center mb-2">
      {["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"].map((d) => (
        <div key={d} className="text-[#71717A] font-semibold text-[10px] text-center">
          {d}
        </div>
      ))}
    </div>

    {/* Weeks */}
    <div className="space-y-1">
      {rows}
    </div>
  </div>
  );
}

function UpcomingList({ events, selectedEvent, setSelectedEvent, setOpenForm, deleteSchedule }) {
  const today = new Date();
  const days = Array.from({ length: 6 }, (_, i) => addDays(today, i)); // 0…5

  return days.map((day, idx) => {
    const label =
      idx === 0
        ? "Today"
        : idx === 1
        ? "Tomorrow"
        : format(day, "EEE, dd/MM/yyyy");

    const dayEvents = events.filter((e) => isSameDay(e.start, day));
    if (dayEvents.length === 0) return null;

    return (
      <div key={day} className="mb-4 ">
        <h4 className="text-[#36D7A0] font-bold uppercase tracking-wide text-[13px] mb-1">
          {label} &nbsp;{" "}
          <b className="font-normal">{format(day, "dd/MM/yyyy")}</b>
        </h4>
        <div className="flex flex-row flex-wrap gap-5">
          {dayEvents.map((ev) => {
            const t0 = format(ev.start, "h:mm a");
            const t1 = format(ev.end, "h:mm a");
            return (
              <div key={ev.id} className="flex gap-x-2 items-start">
                <div
                  className={`w-[12px] h-[12px] rounded-full mt-0.5 ${ev.colorBg}`}
                ></div>
                <div className="text-white text-[12px]">
                  <div className="flex items-center gap-x-2 ">
                    <p className="text-[11px] font-semibold text-[#A1A1AA]  ">
                    {t0}–{t1}
                   </p>

                   <button onClick={()=>{setSelectedEvent(ev); setOpenForm(true)}} className={`w-[46px] h-[17px] rounded-[30px] ${ev.colorBg}  text-black cursor-pointer `}>Edit</button>
                   <Trash2 size={12} onClick={()=>deleteSchedule(ev.id)} className="cursor-pointer "/>
                  </div>
                  
                  <p className="font-medium ">{ev.title}</p>
                  <p className="text-[11px] font-semibold text-[#A1A1AA] mt-0.5">
                    Dr. {ev.doctorName} <br></br> Patient: {ev.patientName}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  });
}

function EventBlock({ event, hours, selectedSearchedEvent, eventRefs  }) {

  const ref = useRef(null);

  useEffect(() => {
    if (eventRefs) {
      eventRefs[event.id] = ref;
    }
  }, [event.id]);

  const startStr = format(event.start, "h:mm a");
  const endStr = format(event.end, "h:mm a");
  const hourHeight = 64;
  const offsetTop =
    (event.start.getHours() - hours[0]) * hourHeight + 32;
  const height =
    (event.end.getHours() - event.start.getHours()) * hourHeight;

  // 4) detect if this is the one we selected from search
  const isSelected = selectedSearchedEvent?.id === event.id;

  return (
    <div ref={el => {
    if (el) {
      eventRefs.current[event.id] = el;
    } else {
      delete eventRefs.current[event.id];
    }
  }}
      className={`absolute left-1 right-1 border-l-[4px] rounded-md ${
        event.colorBg
      } bg-opacity-70 hover:bg-opacity-90 px-2 py-1 text-[11px] font-medium overflow-hidden ${
        isSelected ? "ring-2 ring-indigo-500" : ""
      }`}
      style={{ top: offsetTop, height }}
    >
      <p className="font-normal text-[12px] text-gray-700">
        {startStr} – {endStr}
      </p>
      <p className="font-semibold text-[12px] text-gray-700">
        {event.title}
      </p>
    </div>
  );
}

