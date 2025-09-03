import axios from 'axios';
import { Search, X } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { formatDate } from '../RegisterPatient/Helpers/formatDate';
import { formatTime } from '../RegisterPatient/Helpers/formatTime';
const VITE_APP_SERVER = import.meta.env.VITE_APP_SERVER;

const TransferHistory = ({transferHistory, setTransferHistory, patientId, admissionId}) => {

  const [history, setHistory] = useState([])
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTransferHistory()
   }, []);

    const fetchTransferHistory = async () => {
    try {
      const response = await axios.get(
        `${VITE_APP_SERVER}/api/v1/patient/transfer/history/${patientId}/${admissionId}`
      );
      setHistory(response.data.data);
    } catch (error) {
      console.error("Error fetching transfer history", error);
    }
  };

  const reversedHistory = useMemo(() => [...history].reverse(), [history]);

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return reversedHistory;
    const q = searchTerm.toLowerCase();
    return reversedHistory.filter(hist => {
      return (
        hist.from?.floor?.toLowerCase().includes(q) ||
        hist.from?.bed?.toLowerCase().includes(q) ||
        hist.to?.floor?.toLowerCase().includes(q) ||
        hist.to?.bed?.toLowerCase().includes(q)
      );
    });
  }, [reversedHistory, searchTerm]);

  // take only pageSize entries
  const visibleHistory = useMemo(
    () => filteredHistory.slice(0, pageSize),
    [filteredHistory, pageSize]
  );

  return (
      <div className="fixed w-full h-screen z-50 bg-black/50 top-0 bottom-0 left-0 right-0 flex justify-center ">
          <div className="w-[600px] h-fit bg-[#FDFDFD] rounded-[8px] border-[1.5px] border-[#C4C8D2] ">
            <div className="w-full border-b border-b-[#C4C8D2] flex justify-between p-5 ">
              <p className="font-bold text-[18px] text-[#282D30] ">
                View Transfer History
              </p>
              <X
                onClick={() => setTransferHistory(false)}
                color="#A1A3B2"
                className="cursor-pointer"
              />
            </div>

            <div className="w-full flex justify-between items-center p-4 ">
              <div className="flex items-center gap-x-3">
                <p className="font-medium text-[15px] text-[#282D30] ">Show</p>
                <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-[76px] h-[36px] rounded-[8px] border border-[#C4C8D2] px-2"
              >
                {[10, 50, 100].map((n) => (
                  <option key={n} value={n} className="text-[12px] ">
                    {n}
                  </option>
                ))}
              </select>
                <p className="font-medium text-[15px] text-[#282D30] ">
                  entries
                </p>
              </div>

             <div className="relative w-[258px] h-[40px]">
                           {/* Search icon on left */}
                           <Search
                             color="#A3A8B5"
                             size={20}
                             className="absolute top-2.5 left-3"
                           />
             
                           {/* Input field */}
                           <input
                             placeholder="Search by name..."
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                             className="bg-[#F8FAFC] w-full h-full pl-10 pr-8 placeholder:text-[#A3A8B5] rounded-[10px] border border-[#D1D5DB]"
                           />
             
                           {/* Clear (X) icon on right, only shown when input has text */}
                           {searchTerm && (
                             <button
                               onClick={() => setSearchTerm("")}
                               className="absolute top-2.5 right-2 text-[#A3A8B5] hover:text-[#6F3CDB] cursor-pointer"
                             >
                               <X />
                             </button>
                           )}
                         </div>
            </div>

            <div className="w-full px-4 rounded-[8px] overflow-hidden max-h-[300px] overflow-y-scroll scrolll ">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="bg-[#6F3CDB] py-2 px-4 text-start font-semibold text-[12px] text-white border-r border-white rounded-tl-[8px]">
                     From Floor/Bed
                    </th>
                    <th className="bg-[#6F3CDB] py-2 px-4 text-start font-semibold text-[12px] text-white border-r border-white">
                     To Floor/Bed
                    </th>
                    <th className="bg-[#6F3CDB] py-2 px-4 text-start font-semibold text-[12px] text-white border-r border-white">
                      Tasks
                    </th>
                    <th className="bg-[#6F3CDB] py-2 px-4 text-start font-semibold text-[12px] text-white  rounded-tr-[8px]">
                      Time
                    </th>
                  </tr>
                </thead>

                <tbody className=" ">

                  {visibleHistory.length > 0 ? (
                visibleHistory.map((hist, idx) => (                
                  <tr>
                    <td className="bg-[#F6F6F6] py-2 px-4 text-start font-semibold text-[12px] text-white border border-[#C4C8D2]">
                      <div>
                        <p className="font-medium text-[12px] text-[#62636C] ">
                          {hist.from?.floor ?? "-"}
                        </p>
                        <p className="font-medium text-[12px] text-[#62636C] ">
                           {hist.from?.bed ?? "-"}
                        </p>
                      </div>
                    </td>

                    <td className="bg-[#F6F6F6] py-2 px-4 text-start font-semibold text-[12px] text-white border border-[#C4C8D2]">
                      <div>
                        <p className="font-medium text-[12px] text-[#62636C] ">
                          {hist.to?.floor ?? "-"}
                        </p>
                        <p className="font-medium text-[12px] text-[#62636C] ">
                           {hist.to?.bed ?? "-"}
                        </p>
                      </div>
                    </td>

                    <td className="bg-[#F6F6F6] py-2 px-4 text-start font-semibold text-[12px] text-white border border-[#C4C8D2]">
                      <div>
                        <p className="font-medium text-[12px] text-[#62636C] ">
                          111
                        </p>
                      </div>
                    </td>

                    <td className="bg-[#F6F6F6] py-2 px-4 text-start font-semibold text-[12px] text-white border border-[#C4C8D2]">
                      <div>
                        <p className="font-medium text-[12px] text-[#62636C] ">
                          {formatDate(hist.date ? hist.date : "-")} &nbsp;
                          {formatTime(hist.time ? hist.time : "-")}
                        </p>
                      </div>
                    </td>
                  </tr>  
                 ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-[#62636C]">
                    No data found
                  </td>
                </tr>
              )}           
                </tbody>
              </table>
            </div>

            <p className="font-normal text-[13px] text-[#282D30] p-4 ">
              {visibleHistory.length
            ? `1 to ${visibleHistory.length}`
            : "0"}
          {" of "} {filteredHistory.length} entries
            </p>
          </div>
        </div>
  )
}

export default TransferHistory
