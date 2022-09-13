/* eslint-disable */
// @generated by protobuf-ts 2.7.0 with parameter long_type_string,client_generic,server_none,eslint_disable
// @generated from protobuf file "video/coordinator/user_v1/user.proto" (package "stream.video.coordinator.user_v1", syntax proto3)
// tslint:disable
import type { BinaryWriteOptions } from "@protobuf-ts/runtime";
import type { IBinaryWriter } from "@protobuf-ts/runtime";
import { WireType } from "@protobuf-ts/runtime";
import type { BinaryReadOptions } from "@protobuf-ts/runtime";
import type { IBinaryReader } from "@protobuf-ts/runtime";
import { UnknownFieldHandler } from "@protobuf-ts/runtime";
import type { PartialMessage } from "@protobuf-ts/runtime";
import { reflectionMergePartial } from "@protobuf-ts/runtime";
import { MESSAGE_TYPE } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
import { Timestamp } from "../../../google/protobuf/timestamp";
/**
 * @generated from protobuf message stream.video.coordinator.user_v1.User
 */
export interface User {
    /**
     * @generated from protobuf field: string id = 1;
     */
    id: string;
    /**
     * @generated from protobuf field: repeated string teams = 2;
     */
    teams: string[];
    /**
     * @generated from protobuf field: string role = 3;
     */
    role: string;
    /**
     * @generated from protobuf field: bytes custom_json = 4;
     */
    customJson: Uint8Array;
    /**
     * @generated from protobuf field: string name = 5;
     */
    name: string;
    /**
     * @generated from protobuf field: string image_url = 6;
     */
    imageUrl: string;
    /**
     * User creation date
     *
     * @generated from protobuf field: google.protobuf.Timestamp created_at = 7;
     */
    createdAt?: Timestamp;
    /**
     * User last update date.
     *
     * @generated from protobuf field: google.protobuf.Timestamp updated_at = 8;
     */
    updatedAt?: Timestamp;
}
/**
 * A message that is used in User requests to create and modify user data
 *
 * @generated from protobuf message stream.video.coordinator.user_v1.UserInput
 */
export interface UserInput {
    /**
     * A human-readable name of the user
     *
     * @generated from protobuf field: string name = 1;
     */
    name: string;
    /**
     * User role, as defined by permission settings
     *
     * @generated from protobuf field: string role = 2;
     */
    role: string;
    /**
     * List of user teams for multi-tenant applications
     *
     * @generated from protobuf field: repeated string teams = 3;
     */
    teams: string[];
    /**
     * A URL that points to a user image
     *
     * @generated from protobuf field: string image_url = 4;
     */
    imageUrl: string;
    /**
     * A JSON object with custom user information
     *
     * @generated from protobuf field: bytes custom_json = 5;
     */
    customJson: Uint8Array;
}
// @generated message type with reflection information, may provide speed optimized methods
class User$Type extends MessageType<User> {
    constructor() {
        super("stream.video.coordinator.user_v1.User", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/, options: { "validate.rules": { string: { minLen: "1" } } } },
            { no: 2, name: "teams", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "role", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "custom_json", kind: "scalar", T: 12 /*ScalarType.BYTES*/ },
            { no: 5, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 6, name: "image_url", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 7, name: "created_at", kind: "message", T: () => Timestamp },
            { no: 8, name: "updated_at", kind: "message", T: () => Timestamp }
        ]);
    }
    create(value?: PartialMessage<User>): User {
        const message = { id: "", teams: [], role: "", customJson: new Uint8Array(0), name: "", imageUrl: "" };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<User>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: User): User {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string id */ 1:
                    message.id = reader.string();
                    break;
                case /* repeated string teams */ 2:
                    message.teams.push(reader.string());
                    break;
                case /* string role */ 3:
                    message.role = reader.string();
                    break;
                case /* bytes custom_json */ 4:
                    message.customJson = reader.bytes();
                    break;
                case /* string name */ 5:
                    message.name = reader.string();
                    break;
                case /* string image_url */ 6:
                    message.imageUrl = reader.string();
                    break;
                case /* google.protobuf.Timestamp created_at */ 7:
                    message.createdAt = Timestamp.internalBinaryRead(reader, reader.uint32(), options, message.createdAt);
                    break;
                case /* google.protobuf.Timestamp updated_at */ 8:
                    message.updatedAt = Timestamp.internalBinaryRead(reader, reader.uint32(), options, message.updatedAt);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: User, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* repeated string teams = 2; */
        for (let i = 0; i < message.teams.length; i++)
            writer.tag(2, WireType.LengthDelimited).string(message.teams[i]);
        /* string role = 3; */
        if (message.role !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.role);
        /* bytes custom_json = 4; */
        if (message.customJson.length)
            writer.tag(4, WireType.LengthDelimited).bytes(message.customJson);
        /* string name = 5; */
        if (message.name !== "")
            writer.tag(5, WireType.LengthDelimited).string(message.name);
        /* string image_url = 6; */
        if (message.imageUrl !== "")
            writer.tag(6, WireType.LengthDelimited).string(message.imageUrl);
        /* google.protobuf.Timestamp created_at = 7; */
        if (message.createdAt)
            Timestamp.internalBinaryWrite(message.createdAt, writer.tag(7, WireType.LengthDelimited).fork(), options).join();
        /* google.protobuf.Timestamp updated_at = 8; */
        if (message.updatedAt)
            Timestamp.internalBinaryWrite(message.updatedAt, writer.tag(8, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message stream.video.coordinator.user_v1.User
 */
export const User = new User$Type();
// @generated message type with reflection information, may provide speed optimized methods
class UserInput$Type extends MessageType<UserInput> {
    constructor() {
        super("stream.video.coordinator.user_v1.UserInput", [
            { no: 1, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "role", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "teams", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "image_url", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "custom_json", kind: "scalar", T: 12 /*ScalarType.BYTES*/ }
        ]);
    }
    create(value?: PartialMessage<UserInput>): UserInput {
        const message = { name: "", role: "", teams: [], imageUrl: "", customJson: new Uint8Array(0) };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<UserInput>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: UserInput): UserInput {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string name */ 1:
                    message.name = reader.string();
                    break;
                case /* string role */ 2:
                    message.role = reader.string();
                    break;
                case /* repeated string teams */ 3:
                    message.teams.push(reader.string());
                    break;
                case /* string image_url */ 4:
                    message.imageUrl = reader.string();
                    break;
                case /* bytes custom_json */ 5:
                    message.customJson = reader.bytes();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: UserInput, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string name = 1; */
        if (message.name !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.name);
        /* string role = 2; */
        if (message.role !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.role);
        /* repeated string teams = 3; */
        for (let i = 0; i < message.teams.length; i++)
            writer.tag(3, WireType.LengthDelimited).string(message.teams[i]);
        /* string image_url = 4; */
        if (message.imageUrl !== "")
            writer.tag(4, WireType.LengthDelimited).string(message.imageUrl);
        /* bytes custom_json = 5; */
        if (message.customJson.length)
            writer.tag(5, WireType.LengthDelimited).bytes(message.customJson);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message stream.video.coordinator.user_v1.UserInput
 */
export const UserInput = new UserInput$Type();
