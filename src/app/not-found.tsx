import { ButtonLink } from "@/ui/button";
import { Surface } from "@/ui/surface";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-12">
      <Surface>
        <h1 className="text-3xl leading-10 font-semibold">Страница не найдена</h1>
        <p className="mt-3 text-text-secondary">
          Проверьте адрес или вернитесь на стартовую страницу.
        </p>
        <ButtonLink className="mt-6" href="/">
          На главную
        </ButtonLink>
      </Surface>
    </main>
  );
}
