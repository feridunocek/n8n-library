'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { registerUserAction } from '@/lib/actions';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const [state, dispatch] = useFormState(registerUserAction, undefined);
    const router = useRouter();

    useEffect(() => {
        if (state === 'success') {
            router.push('/login');
        }
    }, [state, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#020817] text-white">
            <div className="w-full max-w-md p-8 space-y-6 bg-secondary/10 rounded-xl border border-white/5 shadow-2xl backdrop-blur-sm">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Register</h1>
                    <p className="text-muted-foreground">Create your first admin account</p>
                </div>

                <form action={dispatch} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300" htmlFor="username">Username</label>
                        <input
                            className="w-full bg-secondary/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            id="username" type="text" name="username" placeholder="Choose a username" required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300" htmlFor="password">Password</label>
                        <input
                            className="w-full bg-secondary/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            id="password" type="password" name="password" placeholder="Choose a secure password" required minLength={6}
                        />
                    </div>
                    <RegisterButton />
                    <div
                        className="flex h-8 items-end space-x-1"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {state && state !== 'success' && (
                            <p className="text-sm text-red-500 text-center w-full">{state}</p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

function RegisterButton() {
    const { pending } = useFormStatus();

    return (
        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" aria-disabled={pending}>
            {pending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
        </button>
    );
}
