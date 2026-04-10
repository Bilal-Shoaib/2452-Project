/**
 * Displays an error message in the dialog and highlights the input fields in red.
 * @param message The error message to display.
 */
export function showError(dialog: HTMLDialogElement,message: string) {
    const errorEl = dialog.querySelector("#error")!;
    errorEl.textContent = message;

    // Highlight inputs in red
    dialog.querySelectorAll("input").forEach(input => {
        input.setAttribute("style", "border-color: red");
    });
}