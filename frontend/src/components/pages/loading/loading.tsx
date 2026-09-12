import { Spinner } from '../..';

export function Loading() {
    return (
        <div className="flex w-screen h-screen items-center justify-center">
            <Spinner className="size-12" />
        </div>
    );
}
