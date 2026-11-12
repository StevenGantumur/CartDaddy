// Folded by default: on the iPad at the cart base the work comes first, but
// anyone viewing the project can open it.
function Disclaimer() {
  return (
    <footer className="mt-10 pb-10">
      <details className="group panel">
        <summary className="flex items-center justify-between gap-4 min-h-14 px-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-base font-semibold">About this project</span>
            <span className="text-sm text-haze-300">Why this exists, what's real, and where it's going</span>
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            aria-hidden="true"
            className="shrink-0 text-haze-300 transition-transform group-open:rotate-180"
          >
            <path d="M4 7 L9 12 L14 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </summary>

        <div className="max-w-3xl space-y-4 text-base text-haze-300 leading-relaxed px-5 pb-6">
          <p>
            This is a prototype, and it leans more visual than production. The lot state you are looking at
            is simulated rather than sensed. What runs underneath it is real though: the route really is
            solved with OR-Tools over measured distances, the counts really are stored in PostgreSQL, and the
            prediction model really is trained on the snapshot history. The numbers on this page are output,
            not mockups. It is proof the idea works, not a finished product.
          </p>

          <p>
            What I want to build next is a simulation page that proves the point directly: that a worker who
            can see the best route on a device beats a worker walking the lot looking for full corrals. Right
            now you spend that time guessing, doubling back, and clearing a corral somebody already got. I
            think the difference is real and I want to measure it instead of just claiming it.
          </p>

          <p>
            I worked carts. It is a lot of walking and a lot of guessing, and most of that is avoidable. Done
            right this cuts the physical strain of the job and gives cart workers back time and better tools
            to actually succeed at it. I would like to see this running at a real store at scale someday.
          </p>

          <p>
            Getting there takes a lot of RFID sensors and production level design work. That is not a small
            lift, but none of it is out of reach.
          </p>

          <p className="text-haze-100 pt-2">— Steven Gantumur, former cart pusher</p>
        </div>
      </details>
    </footer>
  );
}

export default Disclaimer;
