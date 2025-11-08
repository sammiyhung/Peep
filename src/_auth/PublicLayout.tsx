import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <>
      <section className="flex flex-1 justify-center items-start flex-col py-10 px-4 sm:px-6 md:px-8 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          <Outlet />
        </div>
      </section>

      <img
        src="/assets/images/side-img.svg"
        alt="logo"
        className="hidden xl:block h-screen w-1/2 object-cover bg-no-repeat"
      />
    </>
  );
}
