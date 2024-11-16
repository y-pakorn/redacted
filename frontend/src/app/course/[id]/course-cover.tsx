"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { waitForTransactionReceipt } from "viem/actions"
import { useAccount, useClient, useWriteContract } from "wagmi"

import { Course } from "@/types/course"
import { CERTIFICATE_ABI } from "@/lib/certificate"
import { useCertificate } from "@/hooks/useCertificate"
import { useChain } from "@/hooks/useChain"
import { getMintSignature } from "@/services/signature"
import { Button } from "@/components/ui/button"

export function CourseCover({
  course,
  sections,
}: {
  course: Course
  sections: string[]
}) {
  const accessCertificate = useCertificate(course.id)
  const examCertificate = useCertificate(`${course.id}-exam`)
  const certCertificate = useCertificate(`${course.id}-certificate`)
  const chain = useChain()

  const privy = usePrivy()
  const account = useAccount()

  const client = useClient() as any
  const { writeContractAsync } = useWriteContract()

  const [isBuying, setIsBuying] = useState(false)
  const buyCourse = async () => {
    if (!privy.authenticated || !account.address) return

    setIsBuying(true)
    try {
      const level = 0
      const validity = 1000000000000n
      const { signature, value } = await getMintSignature(
        account.address,
        course.id,
        level,
        validity,
        "access"
      )
      const txHash = await writeContractAsync({
        abi: CERTIFICATE_ABI,
        address: chain.certificate,
        functionName: "mint",
        args: [account.address, course.id, level, validity, value, signature],
        value,
      })
      const receipt = await waitForTransactionReceipt(client, {
        hash: txHash,
      })

      if (receipt.status === "reverted") {
        toast.error("Transaction failed", {
          description: `Transaction hash: ${txHash}`,
        })
        return
      }

      toast.success("Access to course granted!", {
        description: `Transaction hash: ${txHash}`,
      })
      accessCertificate.refetch()
    } finally {
      setIsBuying(false)
    }
  }

  const [isBuyingExam, setIsBuyingExam] = useState(false)
  const buyExam = async () => {
    if (!privy.authenticated || !account.address) return

    setIsBuyingExam(true)
    try {
      const level = 0
      const validity = 1000000000000n
      const { signature, value, id } = await getMintSignature(
        account.address,
        course.id,
        level,
        validity,
        "exam"
      )
      const txHash = await writeContractAsync({
        abi: CERTIFICATE_ABI,
        address: chain.certificate,
        functionName: "mint",
        args: [account.address, id, level, validity, value, signature],
        value,
      })
      const receipt = await waitForTransactionReceipt(client, {
        hash: txHash,
      })

      if (receipt.status === "reverted") {
        toast.error("Transaction failed", {
          description: `Transaction hash: ${txHash}`,
        })
        return
      }

      toast.success("Exam access granted!", {
        description: `Transaction hash: ${txHash}`,
      })
      examCertificate.refetch()
    } finally {
      setIsBuyingExam(false)
    }
  }

  const router = useRouter()

  return (
    <div className="space-y-4">
      <img
        src={course.cover_image}
        className="aspect-video h-64 rounded-xl object-cover"
      />
      <h1 className="text-xl font-bold">{course.category}</h1>
      <h1 className="text-4xl font-bold">{course.title}</h1>
      <p>{course.description}</p>
      <p className="text-sm text-muted-foreground">
        Created by {course.author}
      </p>
      <div className="flex items-center gap-2">
        {!privy.authenticated ? (
          <Button
            onClick={() => {
              privy.login()
            }}
          >
            Go Learn!
          </Button>
        ) : accessCertificate.certificate ? (
          <>
            <Button
              onClick={() => {
                router.push(`/course/${course.id}/learn/0`)
              }}
            >
              Go Learn!
            </Button>
            {course.exam &&
              (examCertificate.certificate ? (
                <Button
                  onClick={() => {
                    router.push(`/course/${course.id}/exam`)
                  }}
                  disabled={!!certCertificate.certificate}
                >
                  {certCertificate.certificate
                    ? "Certificate Already Taken!"
                    : "Take Exam For Certificate!"}
                </Button>
              ) : (
                <Button disabled={isBuyingExam} onClick={buyExam}>
                  Certified Now For{" "}
                  {course.exam.price?.amount
                    ? `${course.exam.price.amount} ${chain.nativeCurrency.symbol}`
                    : "Free"}
                  !{" "}
                  {isBuyingExam && (
                    <Loader2 className="ml-2 size-4 animate-spin" />
                  )}
                </Button>
              ))}
          </>
        ) : (
          <Button onClick={buyCourse} disabled={isBuying}>
            Get Course For{" "}
            {course.access_price?.amount
              ? `${course.access_price.amount} ${chain.nativeCurrency.symbol}`
              : "Free"}
            ! {isBuying && <Loader2 className="ml-2 size-4 animate-spin" />}
          </Button>
        )}
      </div>
      <h2 className="text-2xl font-semibold">In this course you will learn</h2>
      <ul className="list-inside list-disc space-y-1">
        {sections.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </div>
  )
}
