import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommandMenu } from "@/components/layout/command-menu";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("CommandMenu keyboard access", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("opens from Ctrl+K", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <CommandMenu
        open={false}
        onOpenChange={onOpenChange}
        onShortcutsOpen={vi.fn()}
      />,
    );

    await user.keyboard("{Control>}k{/Control}");
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("does not hijack slash while typing in an input", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    const input = document.createElement("input");
    document.body.append(input);

    render(
      <CommandMenu
        open={false}
        onOpenChange={onOpenChange}
        onShortcutsOpen={vi.fn()}
      />,
    );

    await user.click(input);
    await user.keyboard("/");
    expect(onOpenChange).not.toHaveBeenCalled();
    input.remove();
  });

  it("navigates with the advertised G then J shortcut", async () => {
    const user = userEvent.setup();

    render(
      <CommandMenu
        open={false}
        onOpenChange={vi.fn()}
        onShortcutsOpen={vi.fn()}
      />,
    );

    await user.keyboard("gj");

    expect(push).toHaveBeenCalledWith("/app/jobs");
  });

  it("does not run route shortcuts from an editable control", async () => {
    const user = userEvent.setup();
    const input = document.createElement("input");
    document.body.append(input);

    render(
      <CommandMenu
        open={false}
        onOpenChange={vi.fn()}
        onShortcutsOpen={vi.fn()}
      />,
    );

    await user.click(input);
    await user.keyboard("gj");

    expect(push).not.toHaveBeenCalled();
    input.remove();
  });
});
