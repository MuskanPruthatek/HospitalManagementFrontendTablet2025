import React from "react";
import { NavLink, Link } from "react-router-dom";
import { Plus } from "lucide-react";

const tabs = [
  {
    to: "/main/patients",
    label: "Patients",
    icon: "/assets/patients.svg",
    icon2: "/assets/patients2.svg",
  },
  {
    to: "/main/beds",
    label: "Beds",
    icon: "/assets/bed.svg",
    icon2: "/assets/bed2.svg",
  },
  {
    to: "/main/ot",
    label: "OT",
    icon: "/assets/ot.svg",
    icon2: "/assets/ot2.svg",
  },
  {
    to: "/main/settings",
    label: "Settings",
    icon: "/assets/settings.svg",
    icon2: "/assets/settings2.svg",
  },
];

const itemBase =
  "flex flex-col items-center justify-center gap-2 text-[11px] leading-none";

const BottomNav = ({ onRegister }) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div className="relative mx-auto w-full">
        {/* Floating Register Patient button */}
        <Link to="/main/patients/register-patient"
          
          className="absolute left-1/2 -top-14 -translate-x-1/2 grid place-items-center
                     h-[120px] w-[120px] rounded-full bg-[#36D7A0] text-white shadow-xl"
          aria-label="Register New Patient"
        >
          <Plus size={50} />
        </Link>

        {/* Bottom bar */}
        <nav
          className="h-[145px] bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.08)]
                  px-10"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul className="flex h-full items-center justify-between">
            {/* Left 2 */}
            {tabs.slice(0, 2).map(({ to, label, icon, icon2 }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `${itemBase} ${
                      isActive ? "text-[#6F3CDB]" : "text-[#282D30]"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <img
                        src={isActive ? icon2 : icon}
                        alt={label}
                        className="lg:w-[65px] lg:h-[65px] md:w-[55px] md:h-[55px] "
                      />
                      <span className="mt-0.5 font-semibold text-[18px] ">
                        {label}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}

            {/* Spacer for the floating button */}
            <li className="w-16 pointer-events-none" aria-hidden />

            {/* Right 2 */}
            {tabs.slice(2).map(({ to, label, icon, icon2 }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `${itemBase} ${
                      isActive ? "text-[#6F3CDB]" : "text-[#282D30]"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <img
                        src={isActive ? icon2 : icon}
                        alt={label}
                        className="lg:w-[65px] lg:h-[65px] md:w-[55px] md:h-[55px] "
                      />
                      <span className="mt-0.5 font-semibold text-[18px] ">
                        {label}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Label under FAB */}
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-10">
          <span
            className="absolute  left-1/2 top-[53px] -translate-x-1/2
                            text-[18px] font-medium text-[#282D30] text-center whitespace-nowrap "
          >
            Register New Patient
          </span>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
