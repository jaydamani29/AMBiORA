import Link from "next/link";
import { PetalsCanvas } from "@/components/PetalsCanvas";

export default function Home() {
  return (
    <div id="home">
      <PetalsCanvas />
      <main>
        <div className="hero">
          <picture className="hero-art">
            <source srcSet="/assets/samurai.webp" type="image/webp" />
            <img src="/assets/samurai.png" alt="Ronin under a cherry blossom tree" width="800" height="1600" loading="eager" />
          </picture>
          <div className="hero-text">
            <h1 className="brush-reveal">
              Ambiora<span>Arena</span>
            </h1>
            <p>Five clans. One blade. One champion.</p>
            <div className="cta">
              <Link className="btn" href="/signup">
                Build your clan
              </Link>
              <Link className="btn ghost" href="#games">
                See the games
              </Link>
            </div>
            <div className="count" aria-label="Countdown to tournament">
              <div>
                <b id="cd">--</b>
                <small>days</small>
              </div>
              <div>
                <b id="ch">--</b>
                <small>hours</small>
              </div>
              <div>
                <b id="cm">--</b>
                <small>minutes</small>
              </div>
              <div>
                <b id="cs">--</b>
                <small>seconds</small>
              </div>
            </div>
          </div>
        </div>
      </main>
      <div className="ink-divider" aria-hidden="true">
        <div>桜 Registration Open · 戦 Five Teams · 勝 One Champion · 桜 Registration Open · 戦 Five Teams · 勝 One Champion · </div>
      </div>
      <main>
        <section id="games">
          <h2>Pick your battlefield</h2>
          <div className="games">
            <div className="game g1">
              <div className="ic">🎯</div>
              <h3>Valorant</h3>
              <p>5v5 tactical shooter. Plant, defuse and outsmart the other side.</p>
            </div>
            <div className="game g2">
              <div className="ic">🔫</div>
              <h3>BGMI</h3>
              <p>Squad-based battle royale with fast drops and last-circle chaos.</p>
            </div>
            <div className="game g3">
              <div className="ic">⚽</div>
              <h3>eFootball</h3>
              <p>Head-to-head matches where one goal decides the table.</p>
            </div>
            <div className="game g4">
              <div className="ic">🏎️</div>
              <h3>Rocket League</h3>
              <p>Rocket-powered cars, a giant ball and pure momentum.</p>
            </div>
          </div>
        </section>
        <section>
          <h2>By the numbers</h2>
          <div className="stats">
            <div>
              <b>5</b>Teams
            </div>
            <div>
              <b>25</b>Players
            </div>
            <div>
              <b>10</b>Matches
            </div>
            <div>
              <b>5</b>Rounds
            </div>
          </div>
        </section>
        <section className="how-section">
          <h2>How it works</h2>
          <div className="flow">
            <div className="flow-step" data-step="一">
              <h3>Register</h3>
              <p>Add 5 teams with 5 players each: name and in-game ID.</p>
            </div>
            <div className="flow-line" aria-hidden="true"></div>
            <div className="flow-step" data-step="二">
              <h3>Fixtures</h3>
              <p>One click builds a fair round-robin so every team meets once.</p>
            </div>
            <div className="flow-line" aria-hidden="true"></div>
            <div className="flow-step" data-step="三">
              <h3>Play</h3>
              <p>Enter scores after each match and the table updates instantly.</p>
            </div>
            <div className="flow-line" aria-hidden="true"></div>
            <div className="flow-step" data-step="四">
              <h3>Win</h3>
              <p>3 points for a win, 1 for a draw. Top of the table takes the crown.</p>
            </div>
          </div>
        </section>
        <div className="banner">
          <h2>Your clan awaits.</h2>
          <Link className="btn btn-banner" href="/signup">
            Register teams
          </Link>
        </div>
      </main>
    </div>
  );
}
