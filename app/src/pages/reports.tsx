import { useState } from "react";
import { type NextPage } from "next";

import Link from "next/link";
import ContentBox from "@/layout/ContentBox";
import Toggle from "@/layout/Toggle";
import Post from "@/layout/Post";
import Countdown from "@/layout/Countdown";
import InputField from "@/layout/InputField";
import Loader from "@/layout/Loader";
import ParsedReportJson from "@/layout/ReportReason";

import { api } from "@/utils/api";
import { useInfinitePagination } from "@/libs/pagination";
import { useRequiredUserData } from "@/utils/UserContext";
import { reportCommentExplain } from "@/utils/reports";
import { reportCommentColor } from "@/utils/reports";
import { useUserSearch } from "@/utils/search";

const Reports: NextPage = () => {
  const { data: userData } = useRequiredUserData();

  const [lastElement, setLastElement] = useState<HTMLDivElement | null>(null);
  const [showUnhandled, setShowUnhandled] = useState<boolean>(true);
  const [showAll, setShowAll] = useState<boolean>(true);
  const { register, errors, searchTerm } = useUserSearch();

  const {
    data: reports,
    isFetching,
    fetchNextPage,
    hasNextPage,
  } = api.reports.getAll.useInfiniteQuery(
    {
      ...(userData?.role === "USER"
        ? {}
        : { isUnhandled: showUnhandled, showAll: showAll }),
      ...(searchTerm ? { username: searchTerm } : {}),
      limit: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      keepPreviousData: true,
      staleTime: Infinity,
      enabled: userData !== undefined,
    }
  );
  const allReports = reports?.pages.map((page) => page.data).flat();

  useInfinitePagination({
    fetchNextPage,
    hasNextPage,
    lastElement,
  });

  if (!userData) return <Loader explanation="Loading userdata" />;

  return (
    <ContentBox
      title="Reports"
      subtitle={userData?.role === "USER" ? "Your reports" : "Overview"}
      topRightContent={
        userData?.role !== "USER" && (
          <div className="flex flex-col items-start">
            <div className="w-full">
              <InputField
                id="username"
                placeholder="Search Username"
                register={register}
                error={errors.username?.message}
              />
            </div>
            <div className="pb-2"></div>
            <div className="w-full flex flex-row pb-2 m-1">
              <Toggle value={showUnhandled} setShowActive={setShowUnhandled} />
              {!showUnhandled && (
                <Toggle
                  value={showAll}
                  setShowActive={setShowAll}
                  labelActive="All"
                  labelInactive="Banned"
                />
              )}
            </div>
          </div>
        )
      }
    >
      {isFetching ? (
        <Loader explanation="Fetching Results..." />
      ) : (
        <div>
          {allReports?.length === 0 && <p>No reports found</p>}
          {allReports?.flatMap((entry, i) => {
            const report = entry.UserReport;
            const reportedUser = entry.reportedUser;
            return (
              reportedUser && (
                <div
                  key={report.id}
                  ref={i === allReports.length - 1 ? setLastElement : null}
                >
                  <Link href={"/reports/" + report.id}>
                    <Post
                      title={reportCommentExplain(report.status)}
                      color={reportCommentColor(report.status)}
                      user={reportedUser}
                      hover_effect={true}
                    >
                      {report.banEnd && (
                        <div className="mb-3">
                          <b>Ban countdown:</b> <Countdown targetDate={report.banEnd} />
                          <hr />
                        </div>
                      )}
                      <ParsedReportJson report={report} />
                      <b>Report by</b> {reportedUser.username}
                    </Post>
                  </Link>
                </div>
              )
            );
          })}
        </div>
      )}
    </ContentBox>
  );
};

export default Reports;
