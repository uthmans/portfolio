const media = `${import.meta.env.BASE_URL}media/portfolio-walkthrough`;

export default function Walkthrough() {
  return (
    <aside className="walkthrough" aria-labelledby="walkthrough-heading">
      <div className="walkthrough-copy">
        <span className="eyebrow">A 41-SECOND INTRODUCTION</span>
        <h3 id="walkthrough-heading">
          See the work
          <br />
          <em>in action.</em>
        </h3>
        <p>
          Meet the person behind the projects and see how the tools turn
          information into useful next steps.
        </p>
        <a className="text-button" href="#project-survey">
          Try the demos below <span aria-hidden="true">↓</span>
        </a>
        <a className="walkthrough-contact" href="#contact">
          Have a project in mind? Let’s talk.
        </a>
      </div>
      <figure>
        <video
          controls
          playsInline
          preload="none"
          width="1920"
          height="1080"
          poster={`${media}-poster.jpg`}
          aria-label="Portfolio introduction and project walkthrough"
          aria-describedby="walkthrough-note"
        >
          <source src={`${media}.mp4`} type="video/mp4" />
          <track
            kind="captions"
            src={`${media}.en.vtt`}
            srcLang="en"
            label="English"
          />
          <a href={`${media}.mp4`} download>
            Download the walkthrough video
          </a>
        </video>
        <figcaption id="walkthrough-note">
          Independent demos with fictional examples. AI responses in this video
          are illustrative; explore the live tools below.
        </figcaption>
      </figure>
      <details className="walkthrough-transcript">
        <summary>Read the video transcript</summary>
        <p>
          Hey, my name is Uthman Salama. I build websites and practical tools
          that make everyday work easier.
        </p>
        <p>
          My background is in technology coordination and operations, so I care
          about how a website looks and how it supports your business.
        </p>
        <p>
          Whether you need a clear business website, an interactive form, a
          calculator, or a better way to organise your projects, I can help you
          turn your idea into something useful.
        </p>
        <p>
          You can explore examples of my work in my portfolio, including a
          business website, a survey dashboard, and a freelancer project hub.
        </p>
        <p>
          Just send me a message, tell me what you’re working on, and let’s talk
          about it, and let’s do and build what you need.
        </p>
      </details>
    </aside>
  );
}
