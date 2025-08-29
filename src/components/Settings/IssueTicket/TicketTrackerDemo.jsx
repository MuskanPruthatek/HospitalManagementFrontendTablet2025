import React from "react";
import { Check, Clock } from "lucide-react";

/**
 * TicketTracker (JSX version)
 * ─────────────────────────────────────────────────────────────────
 * A sleek vertical stepper/timeline for ticket status using TailwindCSS.
 * - Pure JSX (no TypeScript)
 * - Accessible (aria-current on active step)
 * - Reusable <TicketTracker /> component + demo with dummy data
 */

const dotStyles = {
  completed:
    "bg-[#36D7A0] ring-2 ring-emerald-200 border-1 border-white text-white",
  current:
    "bg-white ring-2 ring-[#36D7A0] border-1 border-[#36D7A0] text-emerald-600",
  pending:
    "bg-white ring-1 ring-gray-300 border-1 border-gray-200 text-gray-400",
};

const lineStyles = {
  completed: "bg-[#36D7A0]",
  current: "bg-emerald-200",
  pending: "bg-gray-200",
};

function StatusDot({ state }) {
  return (
    <div
      className={`relative z-10 h-5 w-5 rounded-full grid place-items-center ${dotStyles[state]}`}
      aria-hidden
    >
      {state === "completed" ? (
        <Check className="h-3 w-3" />
      ) : state === "current" ? (
        <div className="h-3 w-3 rounded-full bg-[#36D7A0]" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
    </div>
  );
}

function Connector({ state }) {
  return (
    <div className={`absolute left-[9px] top-5 bottom-[-28px] w-[2px] ${lineStyles[state]}`} />
  );
}

function Step({ item, isLast }) {
  return (
    <li className="relative flex gap-4 py-4">
      {/* Track */}
      <div className="relative">
        <StatusDot state={item.state} />
        {!isLast && <Connector state={item.state} />}
      </div>

      {/* Content */}
      <div className="flex-1 -mt-1">
        <div className="flex items-center gap-2">
          <p
            className={`font-semibold text-[22px] tracking-tight ${
              item.state === "pending"
                ? "text-gray-700"
                : item.state === "current"
                ? "text-black"
                : "text-black"
            }`}
            aria-current={item.state === "current" ? "step" : undefined}
          >
            {item.title}
          </p>
          {item.at && (
            <span className="text-xs text-gray-500">{item.at}</span>
          )}
        </div>
        {item.subtitle && (
          <p className=" text-[14px] font-normal leading-6 text-[#282D30] max-w-prose">
            {item.subtitle}
          </p>
        )}
      </div>
    </li>
  );
}

export function TicketTracker({ ticketId, items }) {
  return (
    <div className='w-[95%] mt-10 h-fit p-10 rounded-[20px] bg-[#FDFDFD] mx-auto font-inter  '>
      {/* <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Ticket Status</h2>
        {ticketId && (
          <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 border border-gray-200">
            ID: {ticketId}
          </span>
        )}
      </div> */}
      <ol className="relative">
        {items.map((step, idx) => (
          <Step key={step.id} item={step} isLast={idx === items.length - 1} />
        ))}
      </ol>
    </div>
  );
}

export default function TicketTrackerDemo() {
  const demo = [
    {
      id: "1",
      title: "Request accepted",
      subtitle:
        "We have logged your request and created a ticket in our system.",
      state: "completed",
      at: "10:02 AM",
    },
    {
      id: "2",
      title: "Query sent to our technician",
      subtitle:
        "Our technician is reviewing your case. Typical turnaround is a few hours.",
      state: "completed",
      at: "10:05 AM",
    },
    {
      id: "3",
      title: "Technician will contact you shortly",
      subtitle:
        "If we need more details, we will reach out at your registered phone or email.",
      state: "current",
      at: "—",
    },
    {
      id: "4",
      title: "Resolution & feedback",
      subtitle: "We will resolve the issue and ask for a quick feedback rating.",
      state: "pending",
    },
  ];

  return (
    
      <TicketTracker ticketId="#TCK-12034" items={demo} />
   
  );
}
