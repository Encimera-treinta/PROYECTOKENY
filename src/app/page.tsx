import Link from "next/link";
import HomeAnimations from "@/components/HomeAnimations";
import "@/styles/home.css";

export default function HomePage() {
  return (
    <main className="home-page">
      <HomeAnimations />
      {/* ==============================
          HERO
      ============================== */}
      <section className="home-hero">
        <video
          className="home-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source
            src="/img/Video_Fondo.mp4"
            type="video/mp4"
          />
        </video>

        <div className="home-hero-overlay" />

        <div className="home-hero-content">
          <span className="hero-kicker">
            SPORTCRZ / 2026
          </span>

          <h1 className="hero-title">
            <span>NO ES</span>
            <span>SUERTE.</span>
          </h1>

          <div className="hero-bottom">
            <p>
              Movimiento, estilo y actitud.
              <br />
              Diseñado para destacar.
            </p>

            <Link
              href="/mujeres"
              className="hero-shop-link"
            >
              VER COLECCIÓN
              <span></span>
            </Link>
          </div>
        </div>

        <div className="hero-footer">
          <span>SCROLL TO EXPLORE</span>
          <span className="hero-brand">
            SPORTCRZ
          </span>
          <span>PANAMÁ</span>
        </div>
      </section>

      {/* ==============================
          INTRO
      ============================== */}
      <section className="home-intro">
        <div className="home-container">
          <span className="section-index">
            01 / SPORTCRZ
          </span>

          <div className="intro-layout">
            <h2>
              ROPA QUE
              <br />
              SE MUEVE
              <br />
              CONTIGO.
            </h2>

            <div className="intro-copy">
              <p>
                SportCrz nace para quienes no quieren elegir
                entre rendimiento y estilo.
              </p>

              <p>
                Una marca creada para entrenar, competir,
                salir y vivir con identidad propia.
              </p>

              <Link
                href="/mujeres"
                className="text-link"
              >
                DESCUBRIR SPORTCRZ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================
          CATEGORÍAS
      ============================== */}
      <section className="categories-section">
        <div className="home-container">
          <div className="section-heading">
            <span className="section-index">
              02 / SHOP
            </span>

            <h2>
              COMPRA POR
              <br />
              CATEGORÍA
            </h2>
          </div>

          <div className="categories-grid">
            <Link
              href="/mujeres"
              className="category-card category-large"
            >
              <img
                src="/img/about2.jpeg"
                alt="Colección para mujeres"
              />

              <div className="category-overlay" />

              <div className="category-content">
                <span>01</span>
                <h3>MUJERES</h3>
                <p>VER COLECCIÓN</p>
              </div>
            </Link>

            <Link
              href="/hombres"
              className="category-card"
            >
              <img
                src="/img/portfolio-2.jpg"
                alt="Colección para hombres"
              />

              <div className="category-overlay" />

              <div className="category-content">
                <span>02</span>
                <h3>HOMBRES</h3>
                <p>VER COLECCIÓN</p>
              </div>
            </Link>

            <Link
              href="/ninos"
              className="category-card"
            >
              <img
                src="/img/portfolio-3.jpg"
                alt="Colección para niños"
              />

              <div className="category-overlay" />

              <div className="category-content">
                <span>03</span>
                <h3>NIÑOS</h3>
                <p>VER COLECCIÓN</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ==============================
          MANIFIESTO
      ============================== */}
      <section className="manifesto-section">
        <div className="manifesto-line">
          BUILT FOR MOVEMENT
        </div>

        <div className="manifesto-line outline">
          DESIGNED FOR LIFE
        </div>

        <div className="manifesto-line">
          SPORTCRZ
        </div>
      </section>

      {/* ==============================
          NUEVA COLECCIÓN
      ============================== */}
      <section className="new-drop-section">
        <div className="home-container">
          <div className="section-heading">
            <span className="section-index">
              03 / NEW DROP
            </span>

            <div className="heading-row">
              <h2>
                NUEVA
                <br />
                COLECCIÓN
              </h2>

              <Link
                href="/mujeres"
                className="text-link"
              >
                VER TODO
              </Link>
            </div>
          </div>

          <div className="drop-grid">
            <article className="drop-card">
              <Link
                href="/mujeres"
                className="drop-image"
              >
                <img
                  src="/img/portfolio-1.jpg"
                  alt="SportCrz Essential"
                />

                <span className="drop-number">
                  01
                </span>
              </Link>

              <div className="drop-info">
                <div>
                  <h3>SPORTCRZ ESSENTIAL</h3>
                  <p>Nueva colección</p>
                </div>

                <span>$39.99</span>
              </div>
            </article>

            <article className="drop-card drop-offset">
              <Link
                href="/hombres"
                className="drop-image"
              >
                <img
                  src="/img/portfolio-4.jpg"
                  alt="SportCrz Performance"
                />

                <span className="drop-number">
                  02
                </span>
              </Link>

              <div className="drop-info">
                <div>
                  <h3>PERFORMANCE SERIES</h3>
                  <p>SportCrz 2026</p>
                </div>

                <span>$44.99</span>
              </div>
            </article>

            <article className="drop-card">
              <Link
                href="/mujeres"
                className="drop-image"
              >
                <img
                  src="/img/portfolio-5.jpg"
                  alt="SportCrz Motion"
                />

                <span className="drop-number">
                  03
                </span>
              </Link>

              <div className="drop-info">
                <div>
                  <h3>MOTION SERIES</h3>
                  <p>Everyday movement</p>
                </div>

                <span>$34.99</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ==============================
          REBAJAS
      ============================== */}
      <section className="sale-banner">
        <div className="sale-background">
          <img
            src="/img/portfolio-6.jpg"
            alt=""
          />
        </div>

        <div className="sale-overlay" />

        <div className="sale-content">
          <span>LIMITED / SALE</span>

          <h2>
            LAST
            <br />
            CHANCE.
          </h2>

          <Link
            href="/rebajas"
            className="sale-link"
          >
            EXPLORAR REBAJAS
            <span></span>
          </Link>
        </div>
      </section>

      {/* ==============================
          HISTORIA / FAMILIA
      ============================== */}
      <section className="story-section">
        <div className="home-container story-layout">
          <div className="story-people">
            <figure className="story-person story-person-main">
              <div className="story-person-image">
                <img
                  src="/img/Team2.png"
                  alt="Keny Alexandra Rincon"
                />
              </div>

              <figcaption>
                <span>01 / FOUNDER</span>
                <h3>Keny Alexandra Rincon</h3>
                <p>Fundadora de SportCrz</p>
              </figcaption>
            </figure>

            <figure className="story-person story-person-secondary">
              <div className="story-person-image">
                <img
                  src="/img/Team.png"
                  alt="Andres David Molero Rincon"
                />
              </div>

              <figcaption>
                <span>02 / DEVELOPMENT</span>
                <h3>Andres David Molero Rincon</h3>
                <p>Desarrollo & tecnología</p>
              </figcaption>
            </figure>
          </div>

          <div className="story-copy">
            <span className="section-index">
              04 / OUR STORY
            </span>

            <h2>
              NO ES
              <br />
              SUERTE.
              <br />
              <span>ES SPORTCRZ.</span>
            </h2>

            <p>
              SportCrz nace como un proyecto familiar con una visión:
              construir una marca de ropa con carácter, estilo e identidad
              propia.
            </p>

            <p>
              Keny lidera la visión de la marca, mientras la tecnología
              nos permite construir una experiencia de compra diferente
              desde el primer día.
            </p>

            <Link
              href="/mujeres"
              className="dark-link"
            >
              CONOCER LA COLECCIÓN
            </Link>
          </div>
        </div>
      </section>

      {/* ==============================
          FOOTER
      ============================== */}
      <footer className="home-footer">
        <div className="home-container">
          <div className="footer-top">
            <h2>SPORTCRZ</h2>

            <div className="footer-nav">
              <Link href="/mujeres">
                MUJERES
              </Link>

              <Link href="/hombres">
                HOMBRES
              </Link>

              <Link href="/ninos">
                NIÑOS
              </Link>

              <Link href="/rebajas">
                REBAJAS
              </Link>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 SPORTCRZ</span>
            <span>NO ES SUERTE, ES SPORTCRZ.</span>
            <span>PANAMÁ</span>
          </div>

          <Link
            href="/admin/login"
            className="admin-secret-entry"
            aria-label="Acceso administrativo"
          >
            <span />
          </Link>
        </div>
      </footer>
    </main>
  );
}
